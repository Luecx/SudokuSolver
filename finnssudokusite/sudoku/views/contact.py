from django.core.mail import EmailMessage, send_mail
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
        send_mail(
            subject=_('Vielen Dank für deine Nachricht'),
            message=_(
                "Hello %(name)s,\n\n"
                "Thank you for your message to SudokuSphere.\n"
                "We will get back to you as soon as possible.\n\n"
                "Best regards,\nFinn and the SudokuSphere Team"
            ) % {'name': name},

            from_email='noreply@sudokusphere.com',
            recipient_list=[user_email],
        )

        return HttpResponse(_("Message sent successfully."))

    return render(request, 'index.html')