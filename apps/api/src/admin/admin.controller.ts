import { Controller, Get, Patch, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { IsOptional, IsString, IsEmail } from 'class-validator';

class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
}

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('profile')
  getProfile() {
    return this.adminService.getProfile();
  }

  @Patch('profile')
  updateProfile(@Body() dto: UpdateProfileDto) {
    return this.adminService.updateProfile(dto);
  }
}
