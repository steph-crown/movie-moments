"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserByEmail, getUserByUsername } from "./users";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Get the inviter's profile for the email
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", currentUser.id)
      .single();

    const inviterName =
      inviterProfile?.display_name || inviterProfile?.username || "Someone";

    const invitationResults = [];

    // Process email invitations
    for (const email of data.emails) {
      const result = await createEmailInvitation({
        email,
        roomId: data.roomId,
        invitedBy: currentUser.id,
        inviterName,
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
        inviterName,
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
  inviterName,
  personalMessage,
  roomTitle,
  roomCode,
}: {
  email: string;
  roomId: string;
  invitedBy: string;
  inviterName: string;
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

    // Send email invitation using Resend
    const emailSent = await sendResendInvitationEmail({
      email,
      roomTitle,
      roomCode,
      inviterName,
      personalMessage,
      isExistingUser: userResult.success,
    });

    if (!emailSent) {
      console.warn(`Participant created but email failed to send for ${email}`);
    }

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
  inviterName,
  personalMessage,
  roomTitle,
  roomCode,
}: {
  username: string;
  roomId: string;
  invitedBy: string;
  inviterName: string;
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
      email: null,
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
      const emailSent = await sendResendInvitationEmail({
        email: profile.email,
        roomTitle,
        roomCode,
        inviterName,
        personalMessage,
        isExistingUser: true,
        username: user.username,
      });

      if (!emailSent) {
        console.warn(
          `Participant created but email failed to send for ${username}`
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error in createUsernameInvitation:", error);
    return { success: false, error: `Failed to invite ${username}` };
  }
}

async function sendResendInvitationEmail({
  email,
  roomTitle,
  roomCode,
  inviterName,
  personalMessage,
  isExistingUser,
  username,
}: {
  email: string;
  roomTitle: string;
  roomCode: string;
  inviterName: string;
  personalMessage?: string;
  isExistingUser: boolean;
  username?: string;
}): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY not found in environment variables");
      return false;
    }

    const roomUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/${roomCode}`;
    const greeting = username ? `@${username}` : "there";
    const actionText = isExistingUser ? "Join Room" : "Sign Up & Join";
    // const actionText = isExistingUser ? "Join Room" : "Create Account & Join";
    const actionUrl = isExistingUser
      ? roomUrl
      : `${process.env.NEXT_PUBLIC_SITE_URL}/auth/signup?roomCode=${roomCode}`;

    const { data, error } = await resend.emails.send({
      // from: "MovieMoments <noreply@moviemoments.com>", // Replace with your verified domain
      from: "MovieMoments <onboarding@resend.dev>", // Replace with your verified domain
      // to: [email],
      to: "emmanuelstephen024@gmail.com",
      subject: `Join "${roomTitle}" on MovieMoments ${email}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>MovieMoments Invitation</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #6366f1; margin: 0; font-size: 28px;">🎬 MovieMoments</h1>
              </div>

              <h2 style="color: #1f2937; margin-bottom: 16px;">Hi ${greeting}!</h2>

              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                <strong>${inviterName}</strong> has invited you to join a movie room: <strong>"${roomTitle}"</strong>
              </p>

              ${
                personalMessage
                  ? `<div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #6366f1;">
                <p style="margin: 0; font-style: italic; color: #475569;">"${personalMessage}"</p>
              </div>`
                  : ""
              }

              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                Watch together, share reactions, and chat in real-time with your friends!
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${actionUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  ${actionText}
                </a>
              </div>

              <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 24px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="color: #6366f1; font-size: 14px; margin: 8px 0 0 0; text-align: center; word-break: break-all;">
                  ${roomUrl}
                </p>
              </div>

              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">

              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                This invitation was sent from MovieMoments. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Error sending email with Resend:", error);
      return false;
    }

    console.log("Email sent successfully with Resend:", data?.id);
    return true;
  } catch (error) {
    console.error("Error in sendResendInvitationEmail:", error);
    return false;
  }
}
