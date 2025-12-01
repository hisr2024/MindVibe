"""Locust load test targeting the MindVibe FastAPI endpoints."""
from locust import HttpUser, between, task


class MindVibeUser(HttpUser):
    wait_time = between(1, 5)

    @task(3)
    def health(self):
        self.client.get("/api/health")

    @task(2)
    def performance_metrics(self):
        self.client.get("/metrics/performance")

    @task(1)
    def semantic_wisdom(self):
        self.client.get("/api/insights/semantic-wisdom", params={"q": "calm my mind"})
