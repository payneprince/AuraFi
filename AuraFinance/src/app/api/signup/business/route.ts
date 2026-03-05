import { NextRequest, NextResponse } from 'next/server';

type BusinessSignupPayload = {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  registrationNumber: string;
  tinNumber: string;
  industry: string;
  businessAddress: string;
  monthlyRevenueRange?: string;
  expectedMonthlyVolume?: string;
  authorizedRepName: string;
  authorizedRepRole: string;
  authorizedRepGhanaCardNumber: string;
  repPhone: string;
  newPassword: string;
  confirmPassword: string;
  transactionPin: string;
  twoFactorMethod: string;
  securityQuestion: string;
  securityAnswer: string;
  acceptedTerms: boolean;
  payrollSize?: string;
  settlementPreference?: string;
  financingNeeds?: string;
};

type StoredBusinessSignup = Omit<
  BusinessSignupPayload,
  'newPassword' | 'confirmPassword' | 'transactionPin' | 'securityAnswer'
> & {
  id: string;
  submittedAt: string;
  security: {
    passwordSet: boolean;
    pinSet: boolean;
    twoFactorMethod: string;
    securityQuestion: string;
  };
};

const businessSignups: StoredBusinessSignup[] = [];

function validatePayload(payload: BusinessSignupPayload): string | null {
  const ghanaCardPattern = /^GHA-\d{9}-\d$/i;

  if (
    !payload.businessName?.trim() ||
    !payload.businessEmail?.trim() ||
    !payload.businessPhone?.trim() ||
    !payload.registrationNumber?.trim() ||
    !payload.tinNumber?.trim() ||
    !payload.industry?.trim() ||
    !payload.businessAddress?.trim() ||
    !payload.authorizedRepName?.trim() ||
    !payload.authorizedRepRole?.trim() ||
    !payload.repPhone?.trim()
  ) {
    return 'Missing required business identity details.';
  }

  if (!ghanaCardPattern.test(payload.authorizedRepGhanaCardNumber?.trim())) {
    return 'Invalid representative Ghana Card number format.';
  }

  if (!payload.newPassword || payload.newPassword.length < 8) {
    return 'Password must be at least 8 characters.';
  }

  if (payload.newPassword !== payload.confirmPassword) {
    return 'Passwords do not match.';
  }

  if (!/^\d{4}$/.test(payload.transactionPin || '')) {
    return 'Transaction PIN must be exactly 4 digits.';
  }

  if (!payload.securityAnswer?.trim()) {
    return 'Security answer is required.';
  }

  if (!payload.acceptedTerms) {
    return 'Terms must be accepted.';
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as BusinessSignupPayload;

    const validationError = validatePayload(payload);
    if (validationError) {
      return NextResponse.json({ success: false, message: validationError }, { status: 400 });
    }

    const existingSignup = businessSignups.find(
      (record) => record.businessEmail.toLowerCase() === payload.businessEmail.toLowerCase(),
    );

    if (existingSignup) {
      return NextResponse.json(
        {
          success: false,
          message: 'A business signup request with this email already exists.',
        },
        { status: 409 },
      );
    }

    const storedRecord: StoredBusinessSignup = {
      id: crypto.randomUUID(),
      businessName: payload.businessName,
      businessEmail: payload.businessEmail,
      businessPhone: payload.businessPhone,
      registrationNumber: payload.registrationNumber,
      tinNumber: payload.tinNumber,
      industry: payload.industry,
      businessAddress: payload.businessAddress,
      monthlyRevenueRange: payload.monthlyRevenueRange,
      expectedMonthlyVolume: payload.expectedMonthlyVolume,
      authorizedRepName: payload.authorizedRepName,
      authorizedRepRole: payload.authorizedRepRole,
      authorizedRepGhanaCardNumber: payload.authorizedRepGhanaCardNumber,
      repPhone: payload.repPhone,
      twoFactorMethod: payload.twoFactorMethod,
      securityQuestion: payload.securityQuestion,
      acceptedTerms: payload.acceptedTerms,
      payrollSize: payload.payrollSize,
      settlementPreference: payload.settlementPreference,
      financingNeeds: payload.financingNeeds,
      submittedAt: new Date().toISOString(),
      security: {
        passwordSet: true,
        pinSet: true,
        twoFactorMethod: payload.twoFactorMethod,
        securityQuestion: payload.securityQuestion,
      },
    };

    businessSignups.push(storedRecord);

    return NextResponse.json({
      success: true,
      message: 'Business signup submitted successfully.',
      signupId: storedRecord.id,
      submittedAt: storedRecord.submittedAt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit business signup.',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 },
    );
  }
}
