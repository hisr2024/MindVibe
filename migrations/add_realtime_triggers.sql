-- NON-INVASIVE EVENT TRIGGERS

CREATE OR REPLACE FUNCTION notify_mood_event()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('mood_events', json_build_object('event_type', 'mood_logged', 'user_id', NEW.user_id, 'mood_score', NEW.mood_score, 'timestamp', NEW.created_at)::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mood_realtime ON moods;
CREATE TRIGGER trigger_mood_realtime AFTER INSERT ON moods FOR EACH ROW EXECUTE FUNCTION notify_mood_event();

CREATE OR REPLACE FUNCTION notify_chat_event()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('chat_events', json_build_object('event_type', 'message_received', 'user_id', NEW.user_id, 'message_id', NEW.id, 'timestamp', NEW.created_at)::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_chat_realtime ON chat_messages;
CREATE TRIGGER trigger_chat_realtime AFTER INSERT ON chat_messages FOR EACH ROW EXECUTE FUNCTION notify_chat_event();
