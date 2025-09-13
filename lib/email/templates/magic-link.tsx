import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface MagicLinkEmailProps {
  magicLink: string;
  email: string;
}

export const MagicLinkEmail = ({
  magicLink,
  email,
}: MagicLinkEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Sign in to oncobot</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <div style={logoContainer}>
              {/* oncobot Logo - HTML table for universal email compatibility */}
              <table style={logoTable} cellPadding="0" cellSpacing="0" border={0}>
                <tbody>
                  <tr>
                    <td style={logoCell}></td>
                    <td style={logoCellFilled}></td>
                    <td style={logoCell}></td>
                  </tr>
                  <tr>
                    <td style={logoCellFilled}></td>
                    <td style={logoCell}></td>
                    <td style={logoCellFilled}></td>
                  </tr>
                  <tr>
                    <td style={logoCell}></td>
                    <td style={logoCellFilled}></td>
                    <td style={logoCell}></td>
                  </tr>
                </tbody>
              </table>
              <Heading style={heading}>oncobot</Heading>
            </div>
            <Hr style={hr} />
            <Text style={paragraph}>
              Hi there,
            </Text>
            <Text style={paragraph}>
              You requested to sign in to oncobot with the email address{' '}
              <strong>{email}</strong>. Click the button below to sign in:
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={magicLink}>
                Sign in to oncobot
              </Button>
            </Section>
            <Text style={paragraph}>
              Or copy and paste this URL into your browser:
            </Text>
            <Link href={magicLink} style={link}>
              {magicLink}
            </Link>
            <Hr style={hr} />
            <Text style={footer}>
              This link will expire in 10 minutes. If you didn&apos;t request this email,
              you can safely ignore it.
            </Text>
            <Text style={footer}>
              — The oncobot Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

MagicLinkEmail.PreviewProps = {
  magicLink: 'https://onco.bot/api/auth/magic-link/verify?token=example-token',
  email: 'user@example.com',
} as MagicLinkEmailProps;

export default MagicLinkEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const logoContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const logoTable = {
  margin: '0 auto',
  marginBottom: '16px',
};

const logoCell = {
  width: '16px',
  height: '16px',
  backgroundColor: 'transparent',
};

const logoCellFilled = {
  width: '16px',
  height: '16px',
  backgroundColor: '#818CF8',
};

const heading = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0',
  marginTop: '12px',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '28px',
  textAlign: 'left' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#818CF8',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 30px',
};

const link = {
  color: '#818CF8',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  marginTop: '20px',
};