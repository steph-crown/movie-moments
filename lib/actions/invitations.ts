"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserByEmail, getUserByUsername } from "./users";

export interface InvitationData {
  roomId: string;
  emails: string[];
  usernames: string[];
  personalMessage?: string;
  roomTitle: string;
  roomCode: string;
}

export async function sendRoomInvitations(data: InvitationData): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user (the one sending invitations)
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return {
        success: false,
        error: "You must be logged in to send invitations",
      };
    }

    const invitationResults = [];

    // Process email invitations
    for (const email of data.emails) {
      const result = await createEmailInvitation({
        email,
        roomId: data.roomId,
        invitedBy: currentUser.id,
        personalMessage: data.personalMessage,
        roomTitle: data.roomTitle,
        roomCode: data.roomCode,
      });
      invitationResults.push(result);
    }

    // Process username invitations
    for (const username of data.usernames) {
      const result = await createUsernameInvitation({
        username,
        roomId: data.roomId,
        invitedBy: currentUser.id,
        personalMessage: data.personalMessage,
        roomTitle: data.roomTitle,
        roomCode: data.roomCode,
      });
      invitationResults.push(result);
    }

    const successCount = invitationResults.filter((r) => r.success).length;
    const alreadyInvitedCount = invitationResults.filter(
      (r) => r.alreadyExists
    ).length;

    if (successCount === 0) {
      return { success: false, error: "No invitations were sent successfully" };
    }

    // Create a more detailed message
    let message = "";
    const newInvites = successCount - alreadyInvitedCount;

    if (newInvites > 0 && alreadyInvitedCount > 0) {
      message = `${newInvites} new invitation${
        newInvites === 1 ? "" : "s"
      } sent! ${alreadyInvitedCount} ${
        alreadyInvitedCount === 1 ? "person was" : "people were"
      } already invited.`;
    } else if (newInvites > 0) {
      message = `${newInvites} invitation${
        newInvites === 1 ? "" : "s"
      } sent successfully!`;
    } else if (alreadyInvitedCount > 0) {
      message = `All selected ${
        alreadyInvitedCount === 1 ? "person is" : "people are"
      } already invited to this room.`;
    }

    return {
      success: true,
      message,
    };
  } catch (error) {
    console.error("Error sending room invitations:", error);
    return { success: false, error: "Failed to send invitations" };
  }
}

async function checkExistingParticipant(
  roomId: string,
  email?: string,
  userId?: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("room_participants")
      .select("id")
      .eq("room_id", roomId);

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (email) {
      query = query.eq("email", email.toLowerCase());
    } else {
      return false;
    }

    const { data, error } = await query.single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking existing participant:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error in checkExistingParticipant:", error);
    return false;
  }
}

async function createEmailInvitation({
  email,
  roomId,
  invitedBy,
  personalMessage,
  roomTitle,
  roomCode,
}: {
  email: string;
  roomId: string;
  invitedBy: string;
  personalMessage?: string;
  roomTitle: string;
  roomCode: string;
}): Promise<{ success: boolean; error?: string; alreadyExists?: boolean }> {
  try {
    const supabase = await createClient();

    // Check if user exists with this email
    const userResult = await getUserByEmail(email);

    let participantData;
    let existingCheck;

    if (userResult.success && userResult.data) {
      // User exists - check if they're already a participant
      existingCheck = await checkExistingParticipant(
        roomId,
        email,
        userResult.data.id
      );

      if (existingCheck) {
        return { success: true, alreadyExists: true };
      }

      participantData = {
        room_id: roomId,
        user_id: userResult.data.id,
        email: email,
        username: userResult.data.username,
        status: "pending",
        role: "member",
        join_method: "invited_email",
        invited_by: invitedBy,
      };
    } else {
      // User doesn't exist - check if email is already invited
      existingCheck = await checkExistingParticipant(roomId, email);

      if (existingCheck) {
        return { success: true, alreadyExists: true };
      }

      participantData = {
        room_id: roomId,
        user_id: null,
        email: email,
        username: null,
        status: "pending",
        role: "member",
        join_method: "invited_email",
        invited_by: invitedBy,
      };
    }

    // Insert room participant record
    const { error: participantError } = await supabase
      .from("room_participants")
      .insert(participantData);

    if (participantError) {
      console.error("Error creating participant:", participantError);
      return { success: false, error: `Failed to invite ${email}` };
    }

    // Send email invitation
    await sendInvitationEmail({
      email,
      roomTitle,
      roomCode,
      personalMessage,
      isExistingUser: userResult.success,
    });

    return { success: true };
  } catch (error) {
    console.error("Error in createEmailInvitation:", error);
    return { success: false, error: `Failed to invite ${email}` };
  }
}

async function createUsernameInvitation({
  username,
  roomId,
  invitedBy,
  personalMessage,
  roomTitle,
  roomCode,
}: {
  username: string;
  roomId: string;
  invitedBy: string;
  personalMessage?: string;
  roomTitle: string;
  roomCode: string;
}): Promise<{ success: boolean; error?: string; alreadyExists?: boolean }> {
  try {
    const supabase = await createClient();

    // Get user by username
    const userResult = await getUserByUsername(username);

    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: `User ${username} not found or doesn't allow invitations`,
      };
    }

    const user = userResult.data;

    // Check if user is already a participant
    const existingCheck = await checkExistingParticipant(
      roomId,
      undefined,
      user.id
    );

    if (existingCheck) {
      return { success: true, alreadyExists: true };
    }

    // Create room participant record
    const participantData = {
      room_id: roomId,
      user_id: user.id,
      email: null, // We don't have email from username lookup
      username: user.username,
      status: "pending",
      role: "member",
      join_method: "invited_username",
      invited_by: invitedBy,
    };

    const { error: participantError } = await supabase
      .from("room_participants")
      .insert(participantData);

    if (participantError) {
      console.error("Error creating participant:", participantError);
      return { success: false, error: `Failed to invite ${username}` };
    }

    // Get user's email for sending notification
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (profile?.email) {
      await sendInvitationEmail({
        email: profile.email,
        roomTitle,
        roomCode,
        personalMessage,
        isExistingUser: true,
        username: user.username,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error in createUsernameInvitation:", error);
    return { success: false, error: `Failed to invite ${username}` };
  }
}

async function sendInvitationEmail({
  email,
  roomTitle,
  roomCode,
  personalMessage,
  isExistingUser,
  username,
}: {
  email: string;
  roomTitle: string;
  roomCode: string;
  personalMessage?: string;
  isExistingUser: boolean;
  username?: string;
}): Promise<void> {
  try {
    // TODO: Implement email sending using your preferred service (Resend, SendGrid, etc.)
    // This is a placeholder implementation

    const roomUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/${roomCode}`;

    const emailData = {
      to: email,
      subject: `You're invited to watch "${roomTitle}" on MovieMoments`,
      html: generateInvitationEmailHTML({
        roomTitle,
        roomUrl,
        personalMessage,
        isExistingUser,
        username,
      }),
    };

    console.log("Email invitation data:", emailData);

    // Example with Resend (uncomment and configure when ready):
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send(emailData);
  } catch (error) {
    console.error("Error sending invitation email:", error);
    // Don't throw error here as the invitation was already created
  }
}

function generateInvitationEmailHTML({
  roomTitle,
  roomUrl,
  personalMessage,
  isExistingUser,
  username,
}: {
  roomTitle: string;
  roomUrl: string;
  personalMessage?: string;
  isExistingUser: boolean;
  username?: string;
}): string {
  const greeting = username ? `Hi @${username}!` : "Hi there!";
  const actionText = isExistingUser ? "Join Room" : "Sign Up & Join";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>MovieMoments Invitation</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6366f1;">🎬 MovieMoments</h1>
        </div>

        <h2>${greeting}</h2>

        <p>You've been invited to join a movie room: <strong>"${roomTitle}"</strong></p>

        ${
          personalMessage
            ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-style: italic;">"${personalMessage}"</p>
        </div>`
            : ""
        }

        <p>Watch together, share reactions, and chat in real-time with your friends!</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${roomUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            ${actionText}
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link into your browser: <br>
          <a href="${roomUrl}">${roomUrl}</a>
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

        <p style="color: #999; font-size: 12px; text-align: center;">
          This invitation was sent from MovieMoments. If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </body>
    </html>
  `;
}
