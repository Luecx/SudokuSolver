from django.core.mail import EmailMessage, send_mail, EmailMultiAlternatives
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from django.http import HttpResponse
from django.utils.translation import gettext as _

@csrf_exempt
def kontaktformular_view(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        user_email = request.POST.get('email')
        user = request.POST.get('user')
        message = request.POST.get('message')

        # 1. E-Mail an kontaktadresse
        admin_message = (
            f"Neue Nachricht über das Kontaktformular:\n\n"
            f"Name: {name}\n"
            f"E-Mail: {user_email}\n"
            f"Benutzer: {user}\n\n"
            f"Nachricht:\n{message}"
        )

        admin_email = EmailMessage(
            subject='Kontaktformular-Anfrage',
            body=admin_message,
            from_email='noreply@sudokusphere.com',
            to=['contact_form@sudokusphere.com'],
            reply_to=[user_email]
        )
        admin_email.send()

        # 2. Auto-Antwort an den Absender
        #         send_mail(
        #             subject=_('Vielen Dank für deine Nachricht'),
        #             message=_(
        #                 "Hello %(name)s,\n\n"
        #                 "Thank you for your message to SudokuSphere.\n"
        #                 "We will get back to you as soon as possible.\n\n"
        #                 "Best regards,\nFinn and the SudokuSphere Team"
        #             ) % {'name': name},
        #
        #             from_email='noreply@sudokusphere.com',
        #             recipient_list=[user_email],
        #         )

        subject = _('Thank you for your message')
        from_email = 'noreply@sudokusphere.com'
        to = [user_email]

        text_content = _(
            "Hello %(name)s,\n\n"
            "Thank you so much for reaching out to SudokuSphere!\n"
            "We truly appreciate your message and will get back to you as soon as possible.\n\n"
            "Warm regards,\n"
            "Finn and the SudokuSphere Team\n\n\n"
            "This is an automated email—please do not reply directly to this message. If you have further questions, feel free to contact us through our website."
        ) % {'name': name}

        html_content = _(
            """
            <p style="padding:2rem"></p>
            <div style="
                width: 100%%;
                max-width: 600px;
                min-width: 60%%;
                box-sizing: border-box;
                padding: 1rem 4vw 4rem;
                margin: auto;
                border: 1px solid #cccccc;
                border-radius: 3rem;
                background-color: white;
                text-align: center;
            ">
                <img src="https://ndb.one/logo.png" alt="Logo" width="80" height="80" style="display: block; margin: 0 auto;" />
                <p>SUDOKUSPHERE.COM</p>
                <p style="text-align: left; margin-top: 6vh;">
                    Hello %(name)s,<br><br>
                    Thank you so much for reaching out to SudokuSphere!<br>
                    We truly appreciate your message and will get back to you as soon as possible.<br><br>
                    Warm regards,<br>
                    Finn and the SudokuSphere Team
                </p>
                <small style="color:#666666">
                    This is an automated email—please do not reply directly to this message. If you have further questions, feel free to contact us through our website.
                </small>
            </div>
            <p style="padding:5rem"></p>
            """
        ) % {'name': name}

        msg = EmailMultiAlternatives(subject, text_content, from_email, to)
        msg.attach_alternative(html_content, "text/html")
        msg.send()

        return HttpResponse(_("Message sent successfully."))

    return render(request, 'index.html')