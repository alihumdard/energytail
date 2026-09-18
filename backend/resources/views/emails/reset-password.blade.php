@component('emails.layout', [
    'subject' => 'Reset your password',
    'preview' => 'A link to choose a new password for your Energy Tail account.',
])

<h1 style="margin:0 0 16px; color:#0f172a; font-size:22px; font-weight:700;">
    Reset your password
</h1>

<p style="margin:0 0 16px; color:#334155; font-size:15px; line-height:1.65;">
    Hi {{ $user->first_name }}, we received a request to reset the password for
    <strong style="color:#0f172a;">{{ $user->email }}</strong>.
</p>

@component('emails.button', ['url' => $url])
    Choose a new password
@endcomponent

<p style="margin:0 0 16px; color:#64748b; font-size:14px; line-height:1.65;">
    This link expires in {{ $minutes }} minutes and can only be used once.
</p>

<p style="margin:0 0 8px; color:#64748b; font-size:13px; line-height:1.65;">
    If the button does not work, copy this address into your browser:
</p>

<p style="margin:0 0 24px; font-size:12px; line-height:1.5; word-break:break-all;">
    <a href="{{ $url }}" style="color:#2563eb;">{{ $url }}</a>
</p>

<p style="margin:0; padding-top:20px; border-top:1px solid #e2e8f0; color:#94a3b8; font-size:13px; line-height:1.6;">
    Did not request this? Ignore this email and your password stays as it is.
    Nothing changes until the link above is opened.
</p>

@endcomponent
