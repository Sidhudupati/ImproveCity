import { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } from '@/config/env';
import userModel from '@/models/user';
import { hashPassword, verifyPassword } from '@/services/auth';
import logger from '@/utils/logger';

export const ensureAdminUser = async (): Promise<void> => {
    const existingAdmin = await userModel.findOne({ email: ADMIN_EMAIL });

    if (!existingAdmin) {
        const password = await hashPassword(ADMIN_PASSWORD);

        await userModel.create({
            email: ADMIN_EMAIL,
            password,
            name: ADMIN_NAME,
            isAdmin: true,
            createdAt: Date.now(),
            data: {}
        });

        logger.info(`Bootstrapped admin user: ${ADMIN_EMAIL}`);
        return;
    }

    const updates: Partial<{
        name: string;
        isAdmin: boolean;
        password: string;
    }> = {};

    if (!existingAdmin.isAdmin) {
        updates.isAdmin = true;
    }

    if (existingAdmin.name !== ADMIN_NAME) {
        updates.name = ADMIN_NAME;
    }

    const passwordMatches = await verifyPassword(ADMIN_PASSWORD, existingAdmin.password);
    if (!passwordMatches) {
        updates.password = await hashPassword(ADMIN_PASSWORD);
    }

    if (Object.keys(updates).length === 0) {
        return;
    }

    await userModel.updateOne({ _id: existingAdmin._id }, { $set: updates });
    logger.info(`Synchronized admin user: ${ADMIN_EMAIL}`);
};
