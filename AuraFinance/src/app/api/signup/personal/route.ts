import { NextRequest, NextResponse } from 'next/server';

type PersonalSignupPayload = {
  fullName: string;
  signupEmail: string;
  phone: string;
  dateOfBirth: string;
  ghanaCardNumber: string;
  ghanaCardExpiry: string;
  residentialAddress: string;
  newPassword: string;
  confirmPassword: string;
  transactionPin: string;
  twoFactorMethod: string;
  securityQuestion: string;
  securityAnswer: string;
  acceptedTerms: boolean;
  employmentStatus?: string;
  monthlyIncomeRange?: string;
  investmentGoal?: string;
  riskTolerance?: string;
  preferredProducts?: string;
};

type StoredSignup = Omit<PersonalSignupPayload, 'newPassword' | 'confirmPassword' | 'transactionPin' | 'securityAnswer'> & {
  id: string;
  submittedAt: string;
  security: {
    passwordSet: boolean;
    pinSet: boolean;
    twoFactorMethod: string;
    securityQuestion: string;
  };
};

const personalSignups: StoredSignup[] = [];

function validatePayload(payload: PersonalSignupPayload): string | null {
  const ghanaCardPattern = /^GHA-\d{9}-\d$/i;

  if (
    !payload.fullName?.trim() ||
    !payload.signupEmail?.trim() ||
    !payload.phone?.trim() ||
    !payload.dateOfBirth ||
    !payload.ghanaCardExpiry ||
    !payload.residentialAddress?.trim()
  ) {
    return 'Missing required identity details.';
  }

  if (!ghanaCardPattern.test(payload.ghanaCardNumber?.trim())) {
    return 'Invalid Ghana Card number format.';
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
    const payload = (await req.json()) as PersonalSignupPayload;

    const validationError = validatePayload(payload);
    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 },
      );
    }

    const existingSignup = personalSignups.find(
      (record) => record.signupEmail.toLowerCase() === payload.signupEmail.toLowerCase(),
    );

    if (existingSignup) {
      return NextResponse.json(
        {
          success: false,
          message: 'A signup request with this email already exists.',
        },
        { status: 409 },
      );
    }

    const storedRecord: StoredSignup = {
      id: crypto.randomUUID(),
      fullName: payload.fullName,
      signupEmail: payload.signupEmail,
      phone: payload.phone,
      dateOfBirth: payload.dateOfBirth,
      ghanaCardNumber: payload.ghanaCardNumber,
      ghanaCardExpiry: payload.ghanaCardExpiry,
      residentialAddress: payload.residentialAddress,
      acceptedTerms: payload.acceptedTerms,
      twoFactorMethod: payload.twoFactorMethod,
      securityQuestion: payload.securityQuestion,
      employmentStatus: payload.employmentStatus,
      monthlyIncomeRange: payload.monthlyIncomeRange,
      investmentGoal: payload.investmentGoal,
      riskTolerance: payload.riskTolerance,
      preferredProducts: payload.preferredProducts,
      submittedAt: new Date().toISOString(),
      security: {
        passwordSet: true,
        pinSet: true,
        twoFactorMethod: payload.twoFactorMethod,
        securityQuestion: payload.securityQuestion,
      },
    };

    personalSignups.push(storedRecord);

    return NextResponse.json({
      success: true,
      message: 'Personal signup submitted successfully.',
      signupId: storedRecord.id,
      submittedAt: storedRecord.submittedAt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit personal signup.',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 },
    );
  }
}
