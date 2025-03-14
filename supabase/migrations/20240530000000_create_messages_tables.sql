-- Create messages table for the messaging system
CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "read_at" TIMESTAMPTZ,
    "business_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "public"."messages" ("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_messages_sender_id" ON "public"."messages" ("sender_id");
CREATE INDEX IF NOT EXISTS "idx_messages_recipient_id" ON "public"."messages" ("recipient_id");

-- Add RLS policies
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;

-- Allow users to see messages they sent or received
CREATE POLICY "Users can view their own messages" 
ON "public"."messages" 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Allow users to insert messages
CREATE POLICY "Users can insert messages"
ON "public"."messages"
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Allow users to update messages they sent
CREATE POLICY "Users can update their own messages"
ON "public"."messages"
FOR UPDATE
USING (auth.uid() = sender_id);

-- Allow recipients to mark messages as read
CREATE POLICY "Recipients can mark messages as read"
ON "public"."messages"
FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (
    -- Only allow updating the read_at field
    (OLD.sender_id = NEW.sender_id) AND
    (OLD.recipient_id = NEW.recipient_id) AND
    (OLD.content = NEW.content) AND
    (OLD.sent_at = NEW.sent_at) AND
    (OLD.conversation_id = NEW.conversation_id) AND
    (OLD.business_id = NEW.business_id) AND
    (OLD.created_at = NEW.created_at)
);

COMMENT ON TABLE "public"."messages" IS 'Stores messages between users'; 