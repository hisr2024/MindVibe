# How to Mark a Pull Request as Ready for Review

## Manual Method (Recommended)

To mark PR #28 as ready for review:

1. Go to the PR page: https://github.com/hisr2024/MindVibe/pull/28
2. Click the "Ready for review" button at the bottom of the PR description
3. Confirm the action

## Using GitHub CLI

If you have `gh` CLI installed and authenticated:

```bash
gh pr ready 28 --repo hisr2024/MindVibe
```

## Using GitHub API

You can use the GitHub GraphQL API to mark a PR as ready:

```bash
# Get PR node ID first
PR_ID=$(gh api graphql -f query='
  query($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        id
      }
    }
  }' -f owner='hisr2024' -f name='MindVibe' -F number=28 --jq '.data.repository.pullRequest.id')

# Mark as ready
gh api graphql -f query='
  mutation($pullRequestId: ID!) {
    markPullRequestReadyForReview(input: {pullRequestId: $pullRequestId}) {
      pullRequest {
        isDraft
      }
    }
  }' -f pullRequestId="$PR_ID"
```

## Using Python Script

```python
import requests
import os

token = os.getenv('GITHUB_TOKEN')
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json',
}

# Get PR node ID
query = """
query {
  repository(owner: "hisr2024", name: "MindVibe") {
    pullRequest(number: 28) {
      id
    }
  }
}
"""

response = requests.post(
    'https://api.github.com/graphql',
    json={'query': query},
    headers=headers
)
pr_id = response.json()['data']['repository']['pullRequest']['id']

# Mark as ready
mutation = """
mutation($pullRequestId: ID!) {
  markPullRequestReadyForReview(input: {pullRequestId: $pullRequestId}) {
    pullRequest {
      isDraft
    }
  }
}
"""

response = requests.post(
    'https://api.github.com/graphql',
    json={'query': mutation, 'variables': {'pullRequestId': pr_id}},
    headers=headers
)
print(response.json())
```

## Note

PR #28 ("[WIP] docs: cleanup README, add KEYS and CONTRIBUTING") contains documentation improvements and is currently in draft status. Once marked as ready, it will be available for review and merging.
