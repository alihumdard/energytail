@component('emails.layout', [
    'subject' => 'Welcome to '.config('app.name'),
    'preview' => 'Your account is verified and ready to use.',
])

<h1 style="margin:0 0 16px; color:#0f172a; font-size:22px; font-weight:700;">
    You are all set, {{ $user->first_name }}
</h1>

<p style="margin:0 0 24px; color:#334155; font-size:15px; line-height:1.65;">
    Your email is confirmed and your {{ config('app.name') }} account is ready.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
    <tr>
        <td style="padding:20px;">
            <p style="margin:0 0 6px; color:#0f172a; font-size:15px; font-weight:600;">
                {{ $next['heading'] }}
            </p>
            <p style="margin:0; color:#475569; font-size:14px; line-height:1.6;">
                {{ $next['body'] }}
            </p>
        </td>
    </tr>
</table>

@component('emails.button', ['url' => $url])
    {{ $next['label'] }}
@endcomponent

<p style="margin:0; padding-top:20px; border-top:1px solid #e2e8f0; color:#94a3b8; font-size:13px; line-height:1.6;">
    Need a hand? Reply to this email and we will help.
</p>

@endcomponent
