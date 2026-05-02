from tools.notification_tools import send_sms_or_mock


async def request_medication_details(phone: str, workflow_id: str):
    return await send_sms_or_mock(
        phone,
        "Islington Animal Hospital: please reply with the external medication name/dose or the prescribing vet contact so Dr. Priya can review Bella safely.",
        workflow_id,
    )
