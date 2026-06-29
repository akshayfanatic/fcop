import type { CSSProperties } from 'react';

export const emailStyles = {
  body: {
    margin: 0,
    backgroundColor: '#f6f7f9',
    color: '#171717',
    fontFamily: 'Arial, sans-serif'
  },
  preview: {
    display: 'none',
    maxHeight: 0,
    overflow: 'hidden',
    opacity: 0
  },
  page: {
    width: '100%',
    backgroundColor: '#f6f7f9',
    padding: '32px 16px'
  },
  container: {
    maxWidth: '560px',
    width: '100%',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  brandCell: {
    padding: '28px 28px 8px'
  },
  brandText: {
    margin: 0,
    color: '#111827',
    fontSize: '14px',
    fontWeight: 700
  },
  contentCell: {
    padding: '8px 28px 28px'
  },
  heading: {
    margin: '0 0 16px',
    color: '#111827',
    fontSize: '22px',
    lineHeight: '1.3'
  },
  text: {
    margin: '0 0 16px',
    color: '#374151',
    fontSize: '15px',
    lineHeight: '1.6'
  },
  lastText: {
    margin: 0,
    color: '#374151',
    fontSize: '15px',
    lineHeight: '1.6'
  }
} satisfies Record<string, CSSProperties>;
