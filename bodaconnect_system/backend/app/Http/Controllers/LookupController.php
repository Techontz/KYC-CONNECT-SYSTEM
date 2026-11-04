<?php

namespace App\Http\Controllers;

use App\Models\ParkingPoint;
use App\Support\Permissions;
use Illuminate\Http\JsonResponse;

class LookupController extends Controller
{
    public const WARDS = [
        'Chamwino', 'Chang\'ombe', 'Hazina', 'Ipagala', 'Kikuyu Kaskazini', 'Kikuyu Kusini', 'Kilimani', 'Kiwanja cha Ndege',
        'Makole', 'Majengo', 'Mnadani', 'Nkuhungu', 'Tambukareli', 'Uhuru', 'Viwandani', 'Kizota', 'Mkonze', 'Msalato',
    ];

    public const DOCUMENT_TYPES = [
        'national_id' => 'National ID (NIDA)',
        'driving_licence' => 'Driving licence',
        'vehicle_registration' => 'Vehicle registration card',
        'membership_letter' => 'Association membership letter',
        'other' => 'Other',
    ];

    public const REASON_CODES = [
        ['value' => 'documents_match', 'label' => 'Documents match the record', 'outcome' => 'verified'],
        ['value' => 'confirmed_in_person', 'label' => 'Confirmed in person', 'outcome' => 'verified'],
        ['value' => 'association_confirmed', 'label' => 'Confirmed by the association', 'outcome' => 'verified'],
        ['value' => 'phone_confirmed', 'label' => 'Phone confirmed by OTP', 'outcome' => 'verified'],
        ['value' => 'name_mismatch', 'label' => 'Name does not match document', 'outcome' => 'correction_required'],
        ['value' => 'document_unreadable', 'label' => 'Document unreadable', 'outcome' => 'correction_required'],
        ['value' => 'missing_document', 'label' => 'Required document missing', 'outcome' => 'correction_required'],
        ['value' => 'phone_unreachable', 'label' => 'Phone number unreachable', 'outcome' => 'correction_required'],
        ['value' => 'suspected_fraud', 'label' => 'Suspected fraudulent document', 'outcome' => 'rejected'],
        ['value' => 'not_a_member', 'label' => 'Not a member of the association', 'outcome' => 'rejected'],
        ['value' => 'duplicate_record', 'label' => 'Duplicate of an existing record', 'outcome' => 'rejected'],
    ];

    public const VEHICLE_MAKES = ['Boxer', 'TVS', 'Haojue', 'Kinglion', 'Sanlg', 'Fekon', 'Honda', 'Yamaha', 'Bajaj', 'Toyo', 'Other'];

    public const CONSENT_PURPOSES = ['registration', 'association_membership', 'partner_services', 'sms_notifications'];

    public const CONSENT_PURPOSE_LABELS = [
        'registration' => 'Registration and identity verification in the BodaConnect registry',
        'association_membership' => 'Sharing my record with my association (UMAPIDO) for membership',
        'partner_services' => 'Being contacted about partner services (insurance, savings, training)',
        'sms_notifications' => 'Receiving SMS notifications about my registration',
    ];

    public function index(): JsonResponse
    {
        $wards = collect(self::WARDS)->merge(ParkingPoint::distinct()->pluck('ward'))->unique()->sort()->values();
        $kv = fn (array $a) => collect($a)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values();

        return response()->json(['data' => [
            'wards' => $wards,
            'documentTypes' => $kv(self::DOCUMENT_TYPES),
            'reasonCodes' => self::REASON_CODES,
            'vehicleMakes' => self::VEHICLE_MAKES,
            'consentPurposes' => $kv(self::CONSENT_PURPOSE_LABELS),
            'genders' => $kv(['male' => 'Male', 'female' => 'Female', 'other' => 'Other', 'prefer_not_to_say' => 'Prefer not to say']),
            'verificationMethods' => $kv(['document_review' => 'Document review', 'in_person' => 'In person', 'association_confirmation' => 'Association confirmation', 'phone_otp' => 'Phone OTP']),
            'roles' => $kv(Permissions::ROLE_LABELS),
        ]]);
    }
}
