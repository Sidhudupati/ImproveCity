import { Schema, model } from 'mongoose'
import { Society } from '@/types/community'

const societySchema = new Schema<Society>({
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    members: {
        type: [{
            userId: { type: String, required: true },
            name: { type: String, required: true },
            email: { type: String, required: true },
            role: { type: String, enum: ['admin', 'member'], default: 'member' },
            joinedAt: { type: Number, required: true }
        }],
        default: []
    },
    joinRequests: {
        type: [{
            id: { type: String, required: true },
            userId: { type: String, required: true },
            name: { type: String, required: true },
            email: { type: String, required: true },
            message: { type: String },
            status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
            createdAt: { type: Number, required: true },
            reviewedAt: { type: Number }
        }],
        default: []
    },
    carpools: {
        type: [{
            id: { type: String, required: true },
            userId: { type: String, required: true },
            userName: { type: String, required: true },
            from: { type: String, required: true },
            to: { type: String, required: true },
            departureTime: { type: Number, required: true },
            seats: { type: Number, required: true },
            notes: { type: String },
            status: { type: String, enum: ['open', 'full', 'closed'], default: 'open' },
            createdAt: { type: Number, required: true }
        }],
        default: []
    },
    issues: {
        type: [{
            id: { type: String, required: true },
            title: { type: String, required: true },
            description: { type: String, required: true },
            category: { type: String, required: true },
            status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
            createdByUserId: { type: String, required: true },
            createdByName: { type: String, required: true },
            createdAt: { type: Number, required: true },
            resolvedAt: { type: Number },
            resolutionNote: { type: String }
        }],
        default: []
    },
    notices: {
        type: [{
            id: { type: String, required: true },
            title: { type: String, required: true },
            content: { type: String, required: true },
            postedByUserId: { type: String, required: true },
            postedByName: { type: String, required: true },
            createdAt: { type: Number, required: true }
        }],
        default: []
    },
    chatMessages: {
        type: [{
            id: { type: String, required: true },
            userId: { type: String, required: true },
            userName: { type: String, required: true },
            message: { type: String, required: true },
            createdAt: { type: Number, required: true }
        }],
        default: []
    },
    createdAt: { type: Number, required: true },
    updatedAt: { type: Number, required: true }
})

const societyModel = model<Society>('Society', societySchema)

export default societyModel
