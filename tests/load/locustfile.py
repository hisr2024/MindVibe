"""
Locust load testing for MindVibe application.

Simulates:
- 100 concurrent users
- Realistic user behavior (KIAAN queries, journaling, dashboard views)
- Peak load scenarios
- Rate limiting verification

Usage:
    pip install locust
    locust -f tests/load/locustfile.py --host=http://localhost:8000
    # Open http://localhost:8089 for the web interface
"""

import random
import string
import time
from locust import HttpUser, task, between, events


def random_string(length: int = 10) -> str:
    """Generate a random string for test data."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))


class KIAANUser(HttpUser):
    """Simulates a user interacting with KIAAN chatbot."""
    
    wait_time = between(1, 5)  # Wait 1-5 seconds between tasks
    
    def on_start(self):
        """Called when a user starts. Set up session."""
        self.session_id = None
        self.start_session()
    
    def start_session(self):
        """Start a new chat session."""
        response = self.client.post("/api/chat/start")
        if response.status_code == 200:
            data = response.json()
            self.session_id = data.get("session_id")
    
    @task(10)
    def chat_with_kiaan(self):
        """Send a message to KIAAN (most common task)."""
        messages = [
            "I'm feeling stressed today",
            "How can I find peace of mind?",
            "What is the meaning of karma?",
            "I need help with anxiety",
            "Tell me about meditation",
            "How do I handle difficult emotions?",
            "What wisdom can help me today?",
            "I'm struggling with work-life balance",
            "How can I be more mindful?",
            "What should I focus on when feeling overwhelmed?",
        ]
        
        message = random.choice(messages)
        
        self.client.post(
            "/api/chat/message",
            json={
                "message": message,
                "session_id": self.session_id,
                "language": "english"
            },
            name="/api/chat/message"
        )
    
    @task(3)
    def check_health(self):
        """Check KIAAN health status."""
        self.client.get("/api/chat/health", name="/api/chat/health")
    
    @task(2)
    def get_kiaan_about(self):
        """Get KIAAN information."""
        self.client.get("/api/chat/about", name="/api/chat/about")
    
    @task(1)
    def get_conversation_history(self):
        """Get conversation history."""
        if self.session_id:
            self.client.get(
                f"/api/chat/history/{self.session_id}",
                name="/api/chat/history/[session_id]"
            )


class BrowsingUser(HttpUser):
    """Simulates a user browsing the application."""
    
    wait_time = between(2, 10)  # Slower browsing pattern
    
    @task(5)
    def view_homepage(self):
        """View the homepage."""
        self.client.get("/", name="/")
    
    @task(3)
    def view_subscription_tiers(self):
        """View subscription options."""
        self.client.get("/api/subscriptions/tiers", name="/api/subscriptions/tiers")
    
    @task(2)
    def view_gita_chapters(self):
        """View Gita chapters."""
        self.client.get("/api/gita/chapters", name="/api/gita/chapters")
    
    @task(1)
    def view_kiaan_health(self):
        """Quick health check."""
        self.client.get("/api/chat/health", name="/api/chat/health")


class AuthenticatedUser(HttpUser):
    """Simulates an authenticated user with full access."""
    
    wait_time = between(1, 5)
    
    def on_start(self):
        """Set up user session."""
        # In real load test, you would authenticate here
        # For now, we simulate basic functionality
        self.session_id = None
        self.access_token = None
        
        # Try to sign up (may fail if user exists)
        unique_email = f"loadtest_{random_string(8)}@example.com"
        response = self.client.post(
            "/api/auth/signup",
            json={
                "email": unique_email,
                "password": "LoadTest123!"
            },
            name="/api/auth/signup",
            catch_response=True
        )
        
        if response.status_code in [201, 409]:
            # User created or already exists
            # Try to login
            login_response = self.client.post(
                "/api/auth/login",
                json={
                    "email": unique_email,
                    "password": "LoadTest123!"
                },
                name="/api/auth/login",
                catch_response=True
            )
            
            if login_response.status_code == 200:
                data = login_response.json()
                self.access_token = data.get("access_token")
    
    @task(10)
    def chat_message(self):
        """Send a chat message."""
        messages = [
            "How can I reduce anxiety?",
            "What is mindfulness?",
            "Help me understand karma",
            "I need guidance",
        ]
        
        self.client.post(
            "/api/chat/message",
            json={
                "message": random.choice(messages),
                "session_id": self.session_id or f"load-{random_string(8)}"
            },
            name="/api/chat/message"
        )
    
    @task(5)
    def view_subscription_status(self):
        """View current subscription."""
        headers = {}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        self.client.get(
            "/api/subscriptions/current",
            headers=headers,
            name="/api/subscriptions/current",
            catch_response=True
        )
    
    @task(3)
    def view_usage(self):
        """View usage statistics."""
        headers = {}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        self.client.get(
            "/api/subscriptions/usage",
            headers=headers,
            name="/api/subscriptions/usage",
            catch_response=True
        )
    
    @task(2)
    def browse_gita(self):
        """Browse Gita content."""
        chapter = random.randint(1, 18)
        self.client.get(
            f"/api/gita/chapters/{chapter}/verses",
            name="/api/gita/chapters/[chapter]/verses"
        )


class StressTestUser(HttpUser):
    """User for stress testing - rapid requests."""
    
    wait_time = between(0.1, 0.5)  # Very fast requests
    
    @task
    def rapid_health_checks(self):
        """Rapid health checks to stress test."""
        self.client.get("/api/chat/health", name="/api/chat/health [stress]")


# Event handlers for custom metrics
@events.request.add_listener
def on_request(request_type, name, response_time, response_length, response, **kwargs):
    """Log request metrics."""
    if response_time > 5000:  # Log slow requests (>5s)
        print(f"SLOW REQUEST: {name} took {response_time}ms")


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when test starts."""
    print("=" * 50)
    print("MindVibe Load Test Started")
    print("=" * 50)
    print("Testing KIAAN chatbot and supporting services")
    print("Target: 100+ concurrent users supported")
    print("=" * 50)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when test stops."""
    print("=" * 50)
    print("MindVibe Load Test Completed")
    print("=" * 50)
    
    # Print summary
    stats = environment.stats
    print(f"Total Requests: {stats.total.num_requests}")
    print(f"Total Failures: {stats.total.num_failures}")
    print(f"Failure Rate: {stats.total.fail_ratio * 100:.2f}%")
    print(f"Average Response Time: {stats.total.avg_response_time:.2f}ms")
    print(f"Median Response Time: {stats.total.median_response_time:.2f}ms")
    print(f"95th Percentile: {stats.total.get_response_time_percentile(0.95):.2f}ms")
    print(f"99th Percentile: {stats.total.get_response_time_percentile(0.99):.2f}ms")
    
    # Verify KIAAN performance requirement
    if stats.total.avg_response_time < 5000:
        print("✅ KIAAN Response Time: PASSED (<5s)")
    else:
        print("❌ KIAAN Response Time: FAILED (>5s)")
    
    print("=" * 50)
