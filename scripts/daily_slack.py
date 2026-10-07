import requests
import os
from datetime import datetime

SLACK_TOKEN = os.getenv("SLACK_TOKEN")
CHANNEL_ID = os.getenv("CHANNEL_ID")
SLACK_MEMBERS = os.getenv("SLACK_MEMBERS").split(",")

execution_number = datetime.utcnow().timetuple().tm_yday
next_index = (execution_number - 1) % len(SLACK_MEMBERS)
presenter = f"<@{SLACK_MEMBERS[next_index]}>"

message = (
    f"🎤 Já atualizou seu board do BusinessMap hoje? \n"
    f"Vamos começar a daily em alguns minutos. \n"
    f"Hoje quem toca a daily é: {presenter}!"
)

url = "https://slack.com/api/chat.postMessage"
headers = {"Authorization": f"Bearer {SLACK_TOKEN}", "Content-Type": "application/json"}
data = {
    "channel": CHANNEL_ID,
    "text": message,
    "blocks": [
        {"type": "section", "text": {"type": "mrkdwn", "text": message}},
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Access Daily Link :rocket:",
                    },
                    "style": "primary",
                    "url": "https://link.com",
                    "action_id": "daily_link",
                }
            ],
        },
    ],
}

response = requests.post(url, json=data, headers=headers)
print("Send message:", response.json())
