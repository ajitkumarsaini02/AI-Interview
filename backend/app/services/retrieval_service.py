import os
import json
from typing import List, Dict, Any, Optional


class CurriculumDayItem:

    def __init__(self, day: int, title: str, type: str, tools: List[str], objectives: List[str]):
        self.day = day
        self.title = title
        self.type = type
        self.tools = tools
        self.objectives = objectives

    def to_dict(self):
        return {
            "day": self.day,
            "title": self.title,
            "type": self.type,
            "tools": self.tools,
            "objectives": self.objectives,
        }


class RetrievalService:

    def __init__(self):
        self.curriculum_days: List[CurriculumDayItem] = []
        self.load_curriculum()

    def load_curriculum(self):
        possible_paths = [
            os.path.abspath(os.path.join(os.getcwd(), "..", "data", "curriculum.json")),
            os.path.abspath(os.path.join(os.getcwd(), "data", "curriculum.json")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "curriculum.json")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "curriculum.json")),
        ]

        target_path = None
        for p in possible_paths:
            if os.path.exists(p):
                target_path = p
                break

        if target_path:
            try:
                with open(target_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    days = data.get("days", [])
                    self.curriculum_days = [
                        CurriculumDayItem(
                            day=d["day"],
                            title=d["title"],
                            type=d.get("type", "CONCEPT"),
                            tools=d.get("tools", []),
                            objectives=d.get("objectives", []),
                        )
                        for d in days
                    ]
            except Exception as e:
                print(f"RetrievalService loading error: {e}")

    def get_day_info(self, day: int) -> CurriculumDayItem:
        for d in self.curriculum_days:
            if d.day == day:
                return d
        return CurriculumDayItem(
            day=day,
            title=f"Day {day} Curriculum Concept",
            type="CONCEPT",
            tools=["AI Tools"],
            objectives=[
                f"Understand core principles of Day {day}",
                f"Apply engineering patterns for Day {day}",
                "Analyze trade-offs and performance characteristics",
            ],
        )

    def search_curriculum(self, query: str) -> List[CurriculumDayItem]:
        q = query.lower()
        res = []
        for d in self.curriculum_days:
            if q in d.title.lower() or any(q in obj.lower() for obj in d.objectives):
                res.append(d)
        return res

    def get_all_days(self) -> List[CurriculumDayItem]:
        return self.curriculum_days


retrieval_service = RetrievalService()
