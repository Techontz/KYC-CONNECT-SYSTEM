<?php

namespace App\Http\Controllers;

use App\Http\Requests\UploadDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Support\ApiException;
use App\Support\Audit;
use App\Support\Completeness;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Evidence documents live on the private `local` disk (storage/app/private/documents) under random
 * names. They are never publicly reachable; downloads re-check scope and are audited.
 */
class DocumentController extends Controller
{
    public function store(UploadDocumentRequest $request, string $id): JsonResponse
    {
        $scope = $this->scope();
        $scope->require('documents.upload');
        $person = $scope->findPerson($id);
        if ($scope->isLimitedViewOf($person)) {
            throw ApiException::notFound('Rider not found.');
        }

        $file = $request->file('file');
        $caseId = $request->input('verificationCaseId');
        if ($caseId && ! $person->verificationCases()->whereKey($caseId)->exists()) {
            throw ApiException::validation(['verificationCaseId' => 'Unknown verification case for this rider.']);
        }
        $ext = match ($file->getMimeType()) {
            'application/pdf' => 'pdf',
            'image/png' => 'png',
            default => 'jpg',
        };
        $path = 'documents/'.Str::random(40).'.'.$ext;
        Storage::disk('local')->put($path, file_get_contents($file->getRealPath()));

        $doc = Document::create([
            'person_id' => $person->id,
            'verification_case_id' => $caseId,
            'document_type' => $request->input('documentType'),
            'disk' => 'local',
            'path' => $path,
            'original_name' => Str::limit(basename($file->getClientOriginalName()), 180, ''),
            'mime_type' => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
            'sha256' => hash_file('sha256', $file->getRealPath()),
            'uploaded_by_user_id' => $this->user()->id,
        ]);
        Completeness::refresh($person);
        Audit::record('document.uploaded', $doc, ['documentType' => $doc->document_type, 'sizeBytes' => $doc->size_bytes], null, null, $person->id);

        return $this->item(new DocumentResource($doc), 201);
    }

    public function download(string $id): StreamedResponse
    {
        $scope = $this->scope();
        $scope->require('documents.download');
        $doc = $scope->viaPerson(Document::query())->whereKey($id)->firstOr(fn () => throw ApiException::notFound('Document not found.'));
        if ($scope->isLimitedViewOf($doc->person)) {
            throw ApiException::notFound('Document not found.');
        }
        if (! Storage::disk($doc->disk)->exists($doc->path)) {
            throw ApiException::notFound('Document file is missing.');
        }
        Audit::record('document.downloaded', $doc, ['documentType' => $doc->document_type], null, null, $doc->person_id);

        return Storage::disk($doc->disk)->download($doc->path, $doc->original_name, [
            'Content-Type' => $doc->mime_type,
            'Cache-Control' => 'no-store, private',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
