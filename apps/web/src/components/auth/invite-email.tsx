import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface InviteEmailProps {
  organizationName: string;
  inviterName: string;
  inviteLink: string;
}

export const InviteEmail = ({
  organizationName,
  inviterName,
  inviteLink,
}: InviteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Join {organizationName} on Prism</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={text}>Hello,</Text>
            <Text style={text}>
              {inviterName} has invited you to join {organizationName} on Prism.
            </Text>
            <Text style={text}>
              Prism watches your session replays with AI and tells you what to
              fix.
            </Text>
            <Button style={button} href={inviteLink}>
              Accept Invitation
            </Button>
            <Text style={text}>
              If you didn&apos;t expect this invitation, you can safely ignore
              this email.
            </Text>
            <Text style={text}>
              Best regards,
              <br />
              The Prism Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
};

const text = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#333333",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
  margin: "16px 0",
};
