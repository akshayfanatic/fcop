import type { CSSProperties } from 'react';

export const emailStyles = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: '#07111f',
    color: '#172033',
    fontFamily: 'Arial, Helvetica, sans-serif'
  },
  preview: {
    display: 'none',
    maxHeight: 0,
    overflow: 'hidden',
    opacity: 0,
    color: 'transparent'
  },
  page: {
    width: '100%',
    backgroundColor: '#07111f',
    padding: '48px 16px'
  },
  container: {
    maxWidth: '600px',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    overflow: 'hidden'
  },
  brandCell: {
    padding: '20px 40px',
    backgroundColor: '#0d1121',
    borderBottom: '1px solid #252b3f'
  },
  logo: {
    display: 'block',
    width: '64px',
    height: '64px',
    margin: '0 auto',
    border: 0
  },
  contentCell: {
    padding: '40px',
    textAlign: 'center'
  },
  heading: {
    margin: '0 0 18px',
    color: '#101828',
    fontSize: '30px',
    lineHeight: '36px',
    fontWeight: 700,
    letterSpacing: '-0.6px'
  },
  text: {
    margin: '0 0 16px',
    color: '#475467',
    fontSize: '16px',
    lineHeight: '25px'
  },
  lastText: {
    margin: 0,
    color: '#667085',
    fontSize: '13px',
    lineHeight: '21px'
  },
  button: {
    display: 'inline-block',
    padding: '14px 22px',
    backgroundColor: '#0b8fbd',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
    lineHeight: '20px',
    fontWeight: 700,
    textDecoration: 'none'
  },
  link: {
    color: '#087da5',
    textDecoration: 'underline',
    wordBreak: 'break-all'
  },
  footerCell: {
    padding: '22px 40px',
    backgroundColor: '#f5f8fb',
    borderTop: '1px solid #e4eaf0'
  },
  footerContactText: {
    margin: 0,
    color: '#667085',
    fontSize: '12px',
    lineHeight: '19px'
  },
  footerLink: {
    color: '#087da5',
    textDecoration: 'underline'
  }
} satisfies Record<string, CSSProperties>;
