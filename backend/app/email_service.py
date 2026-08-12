import logging

logger = logging.getLogger("civicissue.email")


def _log(to: str, subject: str, text: str) -> None:
    # No SMTP configured in this deployment; emails are logged instead.
    logger.info("[MAIL] To: %s | Subject: %s | Content:\n%s", to, subject, text)


def send_issue_submitted_email(to_email: str, issue_title: str) -> None:
    subject = f"Civic Issue Submitted: {issue_title}"
    text = (
        "Dear Citizen,\n\n"
        "Your reported issue '%s' has been successfully submitted to the Civic Issue Management System.\n"
        "It is currently assigned the status OPEN and priority MEDIUM. Administrators will review and prioritize it shortly.\n\n"
        "You can track the progress of your complaint in your dashboard.\n\n"
        "Best regards,\n"
        "Civic Issue Management System"
    ) % issue_title
    _log(to_email, subject, text)


def send_status_update_email(to_email: str, issue_title: str, old_status: str, new_status: str) -> None:
    subject = f"Update on Civic Issue: {issue_title}"
    text = (
        "Dear Citizen,\n\n"
        "There has been an update to the civic issue you reported: '%s'.\n\n"
        "Previous Status: %s\n"
        "New Status: %s\n\n"
        "You can log in to check further updates.\n\n"
        "Best regards,\n"
        "Civic Issue Management System"
    ) % (issue_title, old_status, new_status)
    _log(to_email, subject, text)


def send_duplicate_rejection_email(to_email: str, issue_title: str, duplicate_of_id: int) -> None:
    subject = f"Civic Issue Auto-Rejected: {issue_title}"
    text = (
        "Dear Citizen,\n\n"
        "Your reported issue '%s' has been automatically rejected because a similar issue (#%d) "
        "has already been reported nearby and is currently being addressed.\n\n"
        "You can track the progress of the existing issue in your dashboard.\n\n"
        "Best regards,\n"
        "Civic Issue Management System"
    ) % (issue_title, duplicate_of_id)
    _log(to_email, subject, text)
