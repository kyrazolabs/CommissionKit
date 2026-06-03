import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { organization } from "better-auth/plugins";
import { connectDB } from "@workspace/db";
import { dash, sentinel } from "@better-auth/infra";
import { admin } from "better-auth/plugins";
import { logger } from "./logger";
import {
  sendHighPriorityEmail,
  sendMediumPriorityEmail,
} from "@workspace/queue";
import {
  invitationTemplate,
  welcomeTemplate,
  passwordResetTemplate,
  emailVerificationTemplate,
} from "@workspace/email-templates";

// Better Auth requires a database connection.
// We use our existing Mongoose connection for consistency.
const conn = (await connectDB()) as any;
const db = conn?.connection?.db ?? conn?.db;

if (!db) {
  throw new Error(
    "MongoDB database connection failed. Ensure connectDB() is called before initializing auth.",
  );
}

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const AUTH_URL = process.env.BETTER_AUTH_URL || APP_URL;

export const auth = betterAuth({
  database: mongodbAdapter(db),
  baseURL: AUTH_URL,
  trustedOrigins: [APP_URL],

  user: {
    additionalFields: {
      mustChangePassword: {
        type: "boolean",
        defaultValue: false,
      },
      repId: {
        type: "string",
        required: false,
      },
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, token }) => {
      const betterAuthUrl = process.env.BETTER_AUTH_URL || APP_URL || "http://localhost:8088";
      const verificationUrl = `${betterAuthUrl}/api/auth/verify-email?token=${token}&callbackURL=${encodeURIComponent(APP_URL + "/email-verified")}`;
      try {
        await sendHighPriorityEmail({
          to: user.email,
          toName: user.name || undefined,
          subject: "Verify your email address",
          html: emailVerificationTemplate({
            name: user.name || undefined,
            verificationUrl,
            expiresIn: "24 hours",
          }),
          meta: { userId: user.id, event: "email_verification" },
        });
        logger.info({ email: user.email }, "Verification email enqueued");
      } catch (err) {
        logger.error({ err, email: user.email }, "Failed to enqueue verification email");
      }
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }) => {
      const resetUrl = `${APP_URL}/reset-password?token=${token}`;
      try {
        await sendHighPriorityEmail({
          to: user.email,
          toName: user.name || undefined,
          subject: "Reset your CommissionKit password",
          html: passwordResetTemplate({
            name: user.name || undefined,
            resetUrl,
            expiresIn: "1 hour",
          }),
          meta: { userId: user.id, event: "password_reset" },
        });
      } catch (err) {
        logger.error({ err }, "Failed to enqueue password reset email");
      }
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      allowDifferentEmails: true,
    },
  },

  plugins: [
    dash(),
    sentinel(),
    admin(),
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 10,
      membershipLimit: 100,
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days

      sendInvitationEmail: async (data) => {
        const { email, organization: org, inviter, invitation } = data;

        const acceptUrl = `${APP_URL}/accept-invite?id=${invitation.id}`;
        const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000);

        // Derive role from invitation
        const role = (invitation.role as "admin" | "member") ?? "member";

        try {
          await sendHighPriorityEmail({
            to: email,
            subject: `${inviter.user.name} invited you to join ${org.name} on CommissionKit`,
            html: invitationTemplate({
              inviterName: inviter.user.name,
              workspaceName: org.name,
              role,
              acceptUrl,
              expiresAt,
            }),
            meta: {
              event: "workspace_invitation",
              organizationId: org.id,
              invitationId: invitation.id,
            },
          });

          logger.info(
            { email, orgId: org.id },
            "Workspace invitation email enqueued",
          );
        } catch (err) {
          logger.error({ err, email }, "Failed to enqueue invitation email");
        }
      },

      hooks: {
        organization: {
          afterCreate: async ({ organization: org, member }: any) => {
            logger.info(
              { orgId: org.id, name: org.name },
              "Organization created",
            );
          },
        },
        member: {
          afterCreate: async ({ member, organization: org }: any) => {
            logger.info(
              { memberId: member.id, orgId: org.id },
              "Member added to organization",
            );
          },
        },
      },
    }),
  ],

  // @ts-ignore
  trustedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  onResponse: async (context: any) => {
    if (context.response.status >= 400) {
      try {
        const body = await context.response.clone().json();
        logger.error(
          { authError: body },
          `Better Auth Error [${context.response.status}]`,
        );
      } catch {
        logger.error(
          { status: context.response.status },
          "Better Auth Error Response",
        );
      }
    }
  },
});
