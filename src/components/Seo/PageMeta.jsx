import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Janoer Koening';

const PageMeta = ({ title, description, noIndex = false }) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description ? <meta name="description" content={description} /> : null}
      <meta property="og:title" content={fullTitle} />
      {description ? <meta property="og:description" content={description} /> : null}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta name="twitter:title" content={fullTitle} />
      {description ? <meta name="twitter:description" content={description} /> : null}
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
    </Helmet>
  );
};

export default PageMeta;