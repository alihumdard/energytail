{{--
    Shared shell for every transactional email.

    Table-based with inline styles on purpose: Outlook and several webmail
    clients strip <style> blocks and ignore flexbox, so a layout that looks
    right in a browser can collapse in an inbox.
--}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>{{ $subject ?? config('app.name') }}</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

    {{-- Preheader: the grey preview line next to the subject in most inboxes. --}}
    @isset($preview)
        <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
            {{ $preview }}
        </div>
    @endisset

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9; padding:32px 16px;">
        <tr>
            <td align="center">

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;">

                    <tr>
                        <td style="background-color:#0f172a; padding:24px 32px;">
                            <span style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:-0.02em;">
                                {{ config('app.name') }}
                            </span>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px;">
                            {{ $slot }}
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0;">
                            <p style="margin:0; color:#64748b; font-size:12px; line-height:1.6;">
                                Oil, Gas &amp; Energy Jobs &middot;
                                <a href="{{ rtrim(config('app.frontend_url'), '/') }}" style="color:#2563eb; text-decoration:none;">{{ config('app.name') }}</a>
                            </p>
                            <p style="margin:8px 0 0; color:#94a3b8; font-size:12px;">
                                You received this because an account was created with this address.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
