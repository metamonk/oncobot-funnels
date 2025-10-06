./lib/email/templates/base/EmailLayout.tsx:56:11
Type error: Type '{ children: Element[]; xmlns: string; "xmlns:v": string; "xmlns:o": string; }' is not assignable to type 'IntrinsicAttributes & Readonly<Omit<DetailedHTMLProps<HtmlHTMLAttributes<HTMLHtmlElement>, HTMLHtmlElement>, "ref">> & RefAttributes<...>'.
  Property 'xmlns' does not exist on type 'IntrinsicAttributes & Readonly<Omit<DetailedHTMLProps<HtmlHTMLAttributes<HTMLHtmlElement>, HTMLHtmlElement>, "ref">> & RefAttributes<...>'.
  54 | }: EmailLayoutProps) => {
  55 |   return (
> 56 |     <Html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
     |           ^
  57 |       <Head>
  58 |         {/* MSO-specific meta tags for Outlook compatibility */}
  59 |         <meta httpEquiv="X-UA-Compatible" content="IE=edge" />