import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdminService {
  private envPath = path.resolve(process.cwd(), '.env');

  constructor(private config: ConfigService) {}

  getProfile() {
    return {
      name: this.config.get('ADMIN_NAME') || '',
      email: this.config.get('ADMIN_EMAIL') || '',
      phone: this.config.get('ADMIN_PHONE') || '',
    };
  }

  updateProfile(dto: { name?: string; email?: string; phone?: string }) {
    let content = fs.readFileSync(this.envPath, 'utf-8');

    const updates: Record<string, string> = {};
    if (dto.name !== undefined) updates['ADMIN_NAME'] = dto.name;
    if (dto.email !== undefined) updates['ADMIN_EMAIL'] = dto.email;
    if (dto.phone !== undefined) updates['ADMIN_PHONE'] = dto.phone;

    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        content += `\n${key}=${value}`;
      }
    }

    fs.writeFileSync(this.envPath, content, 'utf-8');

    // Update in-memory config
    if (dto.name !== undefined) process.env['ADMIN_NAME'] = dto.name;
    if (dto.email !== undefined) process.env['ADMIN_EMAIL'] = dto.email;
    if (dto.phone !== undefined) process.env['ADMIN_PHONE'] = dto.phone;

    return this.getProfile();
  }
}
