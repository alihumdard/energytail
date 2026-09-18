{{--
    Call-to-action button.

    Wrapped in a table rather than styled as a bare <a>: Outlook ignores
    padding on inline elements, which collapses the button to plain text.
--}}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
    <tr>
        <td align="center" style="background-color:#2563eb; border-radius:8px;">
            <a href="{{ $url }}"
               style="display:inline-block; padding:13px 28px; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none;">
                {{ $slot }}
            </a>
        </td>
    </tr>
</table>
