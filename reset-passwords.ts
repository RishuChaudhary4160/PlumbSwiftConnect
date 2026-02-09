import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const filePath = path.join(process.cwd(), 'server', 'data.json');
const hashedPassword = bcrypt.hashSync('123456', 10);

try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (data.users) {
        data.users.forEach((user: any) => {
            user.password = hashedPassword;
            console.log(`Updated password for ${user.email}`);
        });
    }

    // Also update any plumbers if their userId matches (though users array is the source of truth for login)

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
    console.log('Successfully reset all user passwords to "123456"');
} catch (error) {
    console.error('Error updating passwords:', error);
}
