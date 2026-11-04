<?php

namespace Tests\Feature;

use App\Models\AuditEvent;
use App\Models\Document;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentTest extends TestCase
{
    /** AC-11: documents are private, randomly named, re-checked and audited on download. */
    public function test_document_not_publicly_reachable(): void
    {
        Storage::fake('local');
        $org = $this->makeOrg('UMP');
        $other = $this->makeOrg('OTH');
        $person = $this->makePerson($org);
        $agent = $this->makeUser([['field_agent', $org]]);
        $outsider = $this->makeUser([['field_agent', $other]]);

        $file = UploadedFile::fake()->createWithContent('nida.pdf', "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");
        $res = $this->as($agent)->post("/api/v1/riders/{$person->id}/documents", ['file' => $file, 'documentType' => 'national_id'], ['Accept' => 'application/json'])
            ->assertCreated();
        $this->assertArrayNotHasKey('path', $res->json('data'));
        $doc = Document::first();
        $this->assertStringStartsWith('documents/', $doc->path);
        $this->assertStringNotContainsString('nida', $doc->path);
        $this->assertSame(64, strlen($doc->sha256));
        Storage::disk('local')->assertExists($doc->path);

        // no public route serves the private disk
        $this->get('/storage/'.$doc->path)->assertNotFound();
        $this->get('/'.$doc->path)->assertNotFound();
        $this->app['auth']->forgetGuards();
        $this->withHeaders(['Authorization' => ''])->getJson("/api/v1/documents/{$doc->id}/download")->assertStatus(401);
        $this->as($outsider)->getJson("/api/v1/documents/{$doc->id}/download")->assertStatus(404);

        $this->as($agent)->get("/api/v1/documents/{$doc->id}/download")->assertOk()->assertHeader('Cache-Control', 'no-store, private');
        $this->assertTrue(AuditEvent::where('action', 'document.downloaded')->where('entity_id', $doc->id)->exists());
    }

    public function test_document_validation_rejects_bad_types_and_large_files(): void
    {
        Storage::fake('local');
        $org = $this->makeOrg('UMP');
        $person = $this->makePerson($org);
        $agent = $this->makeUser([['field_agent', $org]]);

        $this->as($agent)->post("/api/v1/riders/{$person->id}/documents", [
            'file' => UploadedFile::fake()->create('script.exe', 10, 'application/x-msdownload'), 'documentType' => 'national_id',
        ], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonStructure(['error' => ['fieldErrors' => ['file']]]);

        $this->as($agent)->post("/api/v1/riders/{$person->id}/documents", [
            'file' => UploadedFile::fake()->image('big.jpg')->size(6000), 'documentType' => 'national_id',
        ], ['Accept' => 'application/json'])->assertStatus(422);
        $this->assertSame(0, Document::count());
    }
}
