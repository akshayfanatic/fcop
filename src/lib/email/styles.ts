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
    width: '52px',
    height: '52px',
    border: 0
  },
  brandCategory: {
    color: '#9ca9bf',
    fontSize: '12px',
    lineHeight: '18px',
    fontWeight: 700
  },
  contentCell: {
    padding: '40px',
    textAlign: 'left'
  },
  context: {
    margin: '0 0 10px',
    color: '#087da5',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 700
  },
  heading: {
    margin: '0 0 14px',
    color: '#101828',
    fontSize: '30px',
    lineHeight: '36px',
    fontWeight: 700,
    letterSpacing: '-0.6px'
  },
  text: {
    margin: '0 0 24px',
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
  buttonRow: {
    margin: '28px 0 20px'
  },
  summary: {
    width: '100%',
    border: '1px solid #dce5ed',
    borderRadius: '10px',
    borderCollapse: 'separate',
    borderSpacing: 0
  },
  summaryTitleCell: {
    padding: '22px 24px 14px'
  },
  summaryLabel: {
    margin: '0 0 5px',
    color: '#667085',
    fontSize: '12px',
    lineHeight: '18px',
    fontWeight: 700
  },
  summaryTitle: {
    margin: 0,
    color: '#172033',
    fontSize: '19px',
    lineHeight: '27px',
    fontWeight: 700
  },
  summaryDetailsCell: {
    padding: '0 24px 20px'
  },
  detailLabel: {
    width: '38%',
    padding: '7px 0',
    color: '#667085',
    fontSize: '14px',
    lineHeight: '20px'
  },
  detailValue: {
    padding: '7px 0',
    color: '#172033',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 700
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
