import { storage } from "./server/storage";
import bcrypt from "bcryptjs";

async function testLogin() {
    console.log("Testing login...");

    // 1. Test loading users
    const users = await storage.getAllUsers();
    console.log(`Loaded ${users.length} users`);
    users.forEach(u => console.log(`- ${u.email} (${u.role})`));

    // 2. Test Get User By Email
    const email = "user@plumbpro.com";
    const user = await storage.getUserByEmail(email);

    if (!user) {
        console.error(`User with email ${email} NOT FOUND`);
        return;
    }
    console.log(`User found: ${user.email}, ID: ${user.id}`);

    // 3. Test Password
    const password = "123456";
    const hash = user.password;
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);

    const isValid = await bcrypt.compare(password, hash);
    console.log(`Password Valid: ${isValid}`);
}

testLogin().catch(console.error);
