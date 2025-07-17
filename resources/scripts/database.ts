import crypto, { scryptSync } from 'crypto';
import { DataTypes, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URI ?? 'sqlite::memory:');

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare uuid: string;
    declare username: string;
    declare email: string;
    declare password: string;
    declare createdAt: Date;
    declare updatedAt: Date;
    declare useTotpAuth: boolean;
    declare rootAdmin: boolean;
}

User.init(
    {
        uuid: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        useTotpAuth: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        rootAdmin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'users',
        timestamps: true,
        sequelize,
    },
);

export const verify = (password: crypto.BinaryLike, hash: string) => {
    const [salt, key] = hash.split(':');
    if (!salt || !key) {
        throw new Error('Invalid hash format');
    }
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
};
