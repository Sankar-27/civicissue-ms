import logging
import random
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Category, Issue, IssueStatus, Priority, Role, User
from .security import hash_password

logger = logging.getLogger("civicissue.seed")

INDIAN_NAMES = [
    "Aarav Sharma", "Vivaan Patel", "Aditya Singh", "Vihaan Kumar", "Arjun Reddy",
    "Sai Prasad", "Rohan Das", "Ishaan Mehta", "Kabir Nair", "Rahul Iyer",
    "Arnav Joshi", "Reyansh Gupta", "Ayaan Verma", "Krishna Rao", "Ivan Kulkarni",
    "Shaurya Choudhury", "Atharv Malhotra", "Advik Srinivasan", "Pranav Menon", "Dhruv Bhat",
    "Karan Desai", "Ayush Mishra", "Ritvik Saxena", "Veer Kapoor", "Aryan Khanna",
    "Siddharth Puri", "Kunal Agarwal", "Rishabh Jain", "Gaurav Soni", "Harsh Vyas",
    "Mayank Trivedi", "Nikhil Oberoi", "Deepak Chatterjee", "Vikram Banerjee", "Rajat Sengupta",
    "Abhishek Mukherjee", "Sourav Ghosh", "Rahul Dutta", "Amit Roy", "Sumit Basu",
    "Debajit Sarkar", "Indranil Halder", "Prasun Pal", "Souvik Das", "Tanmay Chakraborty",
    "Ritwik Bose", "Aniket Ghatak", "Suman Dey", "Prosenjit Mondal", "Biswajit Paul",
]

ISSUE_TITLES = [
    "Large pothole on main road causing accidents",
    "Street light not working for past week",
    "Garbage not collected from residential area",
    "Water leakage from municipal pipe",
    "Illegal parking blocking emergency exit",
    "Broken pavement causing pedestrian injuries",
    "Sewage overflow in neighborhood",
    "Stray dogs creating nuisance in colony",
    "Power fluctuation affecting appliances",
    "Construction debris blocking road",
    "Missing manhole cover dangerous for vehicles",
    "Noise pollution from nearby factory",
    "Encroachment on public footpath",
    "Tree branches touching power lines",
    "Drainage blockage causing waterlogging",
    "Public toilet unclean and unusable",
    "Road sign damaged causing confusion",
    "Traffic signal malfunction at busy junction",
    "Illegal hoarding blocking visibility",
    "Mosquito breeding in stagnant water",
    "Public park in neglected condition",
    "Bus stop shelter broken",
    "Street vendors blocking footpath",
    "Water supply irregular in area",
    "Electric pole leaning dangerously",
    "Road surface damaged due to rain",
    "Illegal dumping in vacant plot",
    "Street light pole damaged",
    "Water pipeline burst",
    "Construction noise beyond permitted hours",
    "Public tap not working",
    "Road marking faded causing accidents",
    "Footpath occupied by hawkers",
    "Storm drain clogged",
    "Electric wires hanging low",
    "Public building wall cracked",
    "Road divider damaged",
    "Traffic congestion due to unauthorized parking",
    "Street dog menace increasing",
    "Water contamination reported",
    "Illegal construction in progress",
    "Park bench broken",
    "Street light flickering continuously",
    "Garbage burning in open area",
    "Road shoulder erosion",
    "Public fountain not operational",
]

DESCRIPTIONS = [
    "This issue has been persisting for several days and needs immediate attention from the concerned authorities.",
    "Residents have complained multiple times but no action has been taken yet. Please resolve this urgently.",
    "The situation is worsening day by day and affecting daily life of citizens in this area.",
    "This poses a serious safety risk to commuters and pedestrians, especially during night hours.",
    "Despite repeated complaints to the municipal corporation, the problem remains unresolved.",
    "This is causing significant inconvenience to the entire neighborhood and requires immediate remedial action.",
    "The issue is particularly problematic during peak hours and affects school children and elderly residents.",
    "Local residents are frustrated with the lack of response from authorities regarding this matter.",
    "This problem has been reported through multiple channels but no solution has been provided yet.",
    "The condition has deteriorated significantly over the past few weeks and needs urgent intervention.",
]


async def seed(db: AsyncSession) -> None:
    admin_email = "admin@civicissue.com"
    result = await db.execute(select(User).where(User.email == admin_email))
    if result.scalar_one_or_none() is None:
        db.add(
            User(
                name="System Administrator",
                email=admin_email,
                password=hash_password("admin123"),
                role=Role.ADMIN,
            )
        )
        await db.commit()
        logger.info("Seeded default admin: %s / admin123", admin_email)

    result = await db.execute(select(func.count(Issue.id)))
    issue_count = result.scalar_one()
    if issue_count > 0:
        return

    users_by_name = {}
    random.seed(42)
    now = datetime.utcnow()

    for i in range(50):
        name = INDIAN_NAMES[i % len(INDIAN_NAMES)]
        email = name.lower().replace(" ", ".") + "@gmail.com"
        if name not in users_by_name:
            user = User(
                name=name,
                email=email,
                password=hash_password("password123"),
                role=Role.CITIZEN,
            )
            db.add(user)
            await db.flush()
            users_by_name[name] = user
        db.add(
            Issue(
                title=ISSUE_TITLES[i % len(ISSUE_TITLES)],
                description=DESCRIPTIONS[random.randint(0, len(DESCRIPTIONS) - 1)],
                category=Category(random.choice([c.value for c in Category])),
                status=IssueStatus(random.choice([s.value for s in IssueStatus])),
                priority=Priority(random.choice([p.value for p in Priority])),
                latitude=round(12.9716 + (random.random() - 0.5) * 0.1, 6),
                longitude=round(77.5946 + (random.random() - 0.5) * 0.1, 6),
                created_at=now - timedelta(days=random.randint(0, 29)),
                reported_by=users_by_name[name],
            )
        )

    await db.commit()
    logger.info("Seeded 50 sample issues with Indian names")
