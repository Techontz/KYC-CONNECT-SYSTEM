<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDisclosureRequest;
use App\Http\Resources\DisclosureResource;
use App\Models\DataDisclosure;
use App\Models\Person;
use App\Models\PrivacyNotice;
use App\Support\ApiException;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrivacyController extends Controller
{
    /** Public. ?language=sw|en (default sw). */
    public function activeNotice(Request $request): JsonResponse
    {
        $lang = in_array($request->query('language'), ['sw', 'en'], true) ? $request->query('language') : 'sw';
        $notice = PrivacyNotice::where('is_active', true)->where('language', $lang)->orderByDesc('published_at')->first()
            ?? PrivacyNotice::where('is_active', true)->orderByDesc('published_at')->first();
        if (! $notice) {
            throw ApiException::notFound('No active privacy notice.');
        }

        return response()->json(['data' => [
            'id' => $notice->id,
            'version' => $notice->version,
            'language' => $notice->language,
            'title' => $notice->title,
            'content' => $notice->content,
            'publishedAt' => $notice->published_at?->toIso8601ZuluString(),
            'availableLanguages' => PrivacyNotice::where('version', $notice->version)->pluck('language'),
        ]]);
    }

    public function storeDisclosure(StoreDisclosureRequest $request): JsonResponse
    {
        $this->scope()->require('privacy.disclosures.manage');
        $v = $request->validated();
        $person = Person::find($v['subjectPersonId']) ?? throw ApiException::validation(['subjectPersonId' => 'Unknown rider.']);
        $d = DataDisclosure::create([
            'subject_person_id' => $person->id,
            'recipient_organisation_id' => $v['recipientOrgId'],
            'purpose' => $v['purpose'],
            'data_categories' => $v['dataCategories'],
            'legal_basis' => $v['legalBasis'],
            'expiry_at' => $v['expiryAt'] ?? null,
            'created_by_user_id' => $this->user()->id,
        ]);
        Audit::record('disclosure.created', $d, [
            'recipientOrgId' => $d->recipient_organisation_id, 'dataCategories' => $d->data_categories, 'legalBasis' => $d->legal_basis,
        ], null, $d->recipient_organisation_id, $person->id);

        return $this->item(new DisclosureResource($d->load(['subject', 'recipient', 'createdBy'])), 201);
    }

    public function disclosures(Request $request): JsonResponse
    {
        $this->scope()->require('privacy.disclosures.manage');
        $q = DataDisclosure::with(['subject', 'recipient', 'createdBy.person'])->orderByDesc('created_at');
        if ($p = $request->query('subjectPersonId')) {
            $q->where('subject_person_id', $p);
        }

        return $this->paginate($q, DisclosureResource::class, $request);
    }
}
