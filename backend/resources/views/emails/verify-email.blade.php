@component('emails.layout', [
    'subject' => 'Confirm your email address',
    'preview' => 'Confirm your address to finish setting up your Energy Tail account.',
])

<h1 style="margin:0 0 16px; color:#0f172a; font-size:22px; font-weight:700;">
    Confirm your email address
</h1>

<p style="margin:0 0 16px; color:#334155; font-size:15px; line-height:1.65;">
    Hi {{ $user->first_name }}, thanks for joining {{ config('app.name') }}. Confirm this
    address and your account is ready to use.
</p>

@component('emails.button', ['url' => $url])
    Confirm email address
@endcomponent

<p style="margin:0 0 16px; color:#64748b; font-size:14px; line-height:1.65;">
    This link expires in {{ $minutes }} minutes. If it does, sign in and request a new one.
</p>

<p style="margin:0 0 8px; color:#64748b; font-size:13px; line-height:1.65;">
    If the button does not work, copy this address into your browser:
</p>

{{-- word-break keeps a long signed URL from stretching the email wide. --}}
<p style="margin:0 0 24px; font-size:12px; line-height:1.5; word-break:break-all;">
    <a href="{{ $url }}" style="color:#2563eb;">{{ $url }}</a>
</p>

<p style="margin:0; padding-top:20px; border-top:1px solid #e2e8f0; color:#94a3b8; font-size:13px; line-height:1.6;">
    Did not sign up? You can ignore this email — the account stays unverified and
    no one can use it.
</p>

@endcomponent
