# Social Features API

## Endpoints

### Friend Connections
- `POST /social/v1/connections` - Send friend request
- `GET /social/v1/connections?status=accepted` - Get friends
- `PUT /social/v1/connections/{id}` - Accept/reject request

### Group Meditations
- `POST /social/v1/groups` - Create group session
- `GET /social/v1/groups` - Get user's groups
- `POST /social/v1/groups/{id}/join` - Join group

### Wisdom Sharing
- `POST /social/v1/wisdom-share` - Share Gita verse
- `GET /social/v1/wisdom-feed` - Get friend's wisdom shares

## Database
All social features use NEW tables only:
- user_connections
- group_meditations
- group_participants
- wisdom_shares
- community_posts

READ-ONLY access to: users, gita_verses
