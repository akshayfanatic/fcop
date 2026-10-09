import { type Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import type { UpdateSiteSettingInput } from '../validators/site-setting.validator.js';

const SITE_SETTING_ID = 'main';

const publicFields = {
  contactEmail: true,
  phone: true,
  whatsapp: true,
  address: true,
  businessHours: true,
  facebookUrl: true,
  twitterUrl: true,
  instagramUrl: true,
  linkedinUrl: true,
  githubUrl: true
} satisfies Prisma.SiteSettingSelect;

export const siteSettingService = {
  getSiteSetting: () => prisma.siteSetting.findUnique({ where: { id: SITE_SETTING_ID }, select: publicFields }),

  updateSiteSetting: (payload: UpdateSiteSettingInput) => {
    const data = {
      contactEmail: payload.contactEmail,
      phone: payload.phone ?? null,
      whatsapp: payload.whatsapp ?? null,
      address: payload.address ?? null,
      businessHours: payload.businessHours ?? null,
      facebookUrl: payload.facebookUrl ?? null,
      twitterUrl: payload.twitterUrl ?? null,
      instagramUrl: payload.instagramUrl ?? null,
      linkedinUrl: payload.linkedinUrl ?? null,
      githubUrl: payload.githubUrl ?? null
    } satisfies Prisma.SiteSettingUpdateInput;

    // Keep one public contact profile when an admin saves the settings form.
    return prisma.siteSetting.upsert({ where: { id: SITE_SETTING_ID }, create: { id: SITE_SETTING_ID, ...data }, update: data, select: publicFields });
  }
};
