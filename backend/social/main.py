from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

app = FastAPI(title="MindVibe Social", version="1.0.0")

from backend.deps import get_db

class ConnectionRequest(BaseModel):
    friend_id: int

class GroupMeditation(BaseModel):
    name: str
    description: Optional[str]
    scheduled_at: datetime

class WisdomShare(BaseModel):
    gita_verse_id: int
    share_text: Optional[str]
    visibility: str = "friends"

@app.get("/social/health")
async def health():
    return {"status": "healthy", "service": "social", "timestamp": datetime.now().isoformat()}

@app.post("/social/v1/connections")
async def send_friend_request(request: ConnectionRequest, current_user_id: int, db: AsyncSession = Depends(get_db)):
    """Send friend connection request"""
    # Check friend exists (read-only from existing users table)
    check_user = text("SELECT id FROM users WHERE id = :friend_id")
    result = await db.execute(check_user, {"friend_id": request.friend_id})
    if not result.first():
        raise HTTPException(404, "User not found")
    
    # Check existing connection
    check_conn = text("SELECT id FROM user_connections WHERE user_id = :user_id AND friend_id = :friend_id")
    existing = await db.execute(check_conn, {"user_id": current_user_id, "friend_id": request.friend_id})
    if existing.first():
        raise HTTPException(400, "Connection already exists")
    
    # Insert into NEW table
    insert = text("""
        INSERT INTO user_connections (user_id, friend_id, status, created_at)
        VALUES (:user_id, :friend_id, 'pending', NOW())
        RETURNING id
    """)
    result = await db.execute(insert, {"user_id": current_user_id, "friend_id": request.friend_id})
    await db.commit()
    
    return {"status": "request_sent", "connection_id": result.scalar()}

@app.get("/social/v1/connections")
async def get_connections(current_user_id: int, status: str = "accepted", db: AsyncSession = Depends(get_db)):
    """Get user's connections"""
    query = text("""
        SELECT uc.id, uc.friend_id, uc.status, uc.created_at, u.username, u.email
        FROM user_connections uc
        JOIN users u ON uc.friend_id = u.id
        WHERE uc.user_id = :user_id AND uc.status = :status
        ORDER BY uc.created_at DESC
    """)
    result = await db.execute(query, {"user_id": current_user_id, "status": status})
    
    connections = [{"id": r.id, "friend_id": r.friend_id, "username": r.username, "status": r.status, "connected_at": str(r.created_at)} for r in result]
    return {"connections": connections}

@app.put("/social/v1/connections/{connection_id}")
async def update_connection(connection_id: int, action: str, current_user_id: int, db: AsyncSession = Depends(get_db)):
    """Accept or reject friend request"""
    if action not in ["accept", "reject"]:
        raise HTTPException(400, "Invalid action")
    
    new_status = "accepted" if action == "accept" else "rejected"
    update = text("""
        UPDATE user_connections 
        SET status = :status 
        WHERE id = :conn_id AND friend_id = :user_id
        RETURNING id
    """)
    result = await db.execute(update, {"status": new_status, "conn_id": connection_id, "user_id": current_user_id})
    await db.commit()
    
    if not result.first():
        raise HTTPException(404, "Connection not found")
    
    return {"status": new_status}

@app.post("/social/v1/groups")
async def create_group_meditation(group: GroupMeditation, current_user_id: int, db: AsyncSession = Depends(get_db)):
    """Create group meditation session"""
    insert = text("""
        INSERT INTO group_meditations (name, description, created_by, scheduled_at, created_at)
        VALUES (:name, :description, :created_by, :scheduled_at, NOW())
        RETURNING id
    """)
    result = await db.execute(insert, {
        "name": group.name,
        "description": group.description,
        "created_by": current_user_id,
        "scheduled_at": group.scheduled_at
    })
    await db.commit()
    
    group_id = result.scalar()
    
    # Auto-join creator
    join = text("INSERT INTO group_participants (group_id, user_id) VALUES (:group_id, :user_id)")
    await db.execute(join, {"group_id": group_id, "user_id": current_user_id})
    await db.commit()
    
    return {"group_id": group_id, "status": "created"}

@app.get("/social/v1/groups")
async def get_groups(current_user_id: int, db: AsyncSession = Depends(get_db)):
    """Get user's group meditations"""
    query = text("""
        SELECT g.id, g.name, g.description, g.scheduled_at, g.created_at, u.username as creator
        FROM group_meditations g
        JOIN users u ON g.created_by = u.id
        JOIN group_participants gp ON g.id = gp.group_id
        WHERE gp.user_id = :user_id
        ORDER BY g.scheduled_at DESC
    """)
    result = await db.execute(query, {"user_id": current_user_id})
    
    groups = [{"id": r.id, "name": r.name, "description": r.description, "scheduled_at": str(r.scheduled_at), "creator": r.creator} for r in result]
    return {"groups": groups}

@app.post("/social/v1/groups/{group_id}/join")
async def join_group(group_id: int, current_user_id: int, db: AsyncSession = Depends(get_db)):
    """Join group meditation"""
    # Check group exists
    check = text("SELECT id FROM group_meditations WHERE id = :group_id")
    result = await db.execute(check, {"group_id": group_id})
    if not result.first():
        raise HTTPException(404, "Group not found")
    
    # Join group
    insert = text("INSERT INTO group_participants (group_id, user_id, joined_at) VALUES (:group_id, :user_id, NOW()) ON CONFLICT DO NOTHING")
    await db.execute(insert, {"group_id": group_id, "user_id": current_user_id})
    await db.commit()
    
    return {"status": "joined"}

@app.post("/social/v1/wisdom-share")
async def share_wisdom(wisdom: WisdomShare, current_user_id: int, db: AsyncSession = Depends(get_db)):
    """Share Gita verse with community"""
    # Check verse exists (read-only from existing table)
    check = text("SELECT id FROM gita_verses WHERE id = :verse_id")
    result = await db.execute(check, {"verse_id": wisdom.gita_verse_id})
    if not result.first():
        raise HTTPException(404, "Verse not found")
    
    # Insert into NEW table
    insert = text("""
        INSERT INTO wisdom_shares (user_id, gita_verse_id, share_text, visibility, created_at)
        VALUES (:user_id, :verse_id, :text, :visibility, NOW())
        RETURNING id
    """)
    result = await db.execute(insert, {
        "user_id": current_user_id,
        "verse_id": wisdom.gita_verse_id,
        "text": wisdom.share_text,
        "visibility": wisdom.visibility
    })
    await db.commit()
    
    return {"share_id": result.scalar(), "status": "shared"}

@app.get("/social/v1/wisdom-feed")
async def get_wisdom_feed(current_user_id: int, limit: int = 20, db: AsyncSession = Depends(get_db)):
    """Get wisdom shares from friends"""
    query = text("""
        SELECT ws.id, ws.share_text, ws.created_at, u.username, gv.verse_text, gv.chapter, gv.verse_number
        FROM wisdom_shares ws
        JOIN users u ON ws.user_id = u.id
        JOIN gita_verses gv ON ws.gita_verse_id = gv.id
        WHERE (ws.visibility = 'public' OR 
               (ws.visibility = 'friends' AND ws.user_id IN (
                   SELECT friend_id FROM user_connections WHERE user_id = :user_id AND status = 'accepted'
               )))
        ORDER BY ws.created_at DESC
        LIMIT :limit
    """)
    result = await db.execute(query, {"user_id": current_user_id, "limit": limit})
    
    feed = [{"id": r.id, "username": r.username, "verse": f"{r.chapter}.{r.verse_number}", "verse_text": r.verse_text, "share_text": r.share_text, "shared_at": str(r.created_at)} for r in result]
    return {"wisdom_feed": feed}
