import { ValidationError } from '@/utils/errors'
import logger from '@/utils/logger'
import 'dotenv/config'

const required = (key: string, value?: string): string => {
    if (!value) {
        const errMessage = `Environment variable "${key}" is missing or invalid.`
        logger.error(errMessage)
        throw new ValidationError(errMessage)
    }
    return value
}

export const PORT = process.env.PORT || '8095'
export const MONGO_URI = required('MONGO_URI', process.env.MONGO_URI)
export const JWT_SECRET_KEY = required('JWT_SECRET_KEY', process.env.JWT_SECRET_KEY)
export const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
export const GMAIL_PASSWORD = required('GMAIL_PASSWORD', process.env.GMAIL_PASSWORD)
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@city.com'
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@City'
export const ADMIN_NAME = process.env.ADMIN_NAME || 'City Admin'
