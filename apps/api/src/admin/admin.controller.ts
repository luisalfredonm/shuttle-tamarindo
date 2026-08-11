import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { IsOptional, IsString, IsEmail } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
}

// Todo el controlador es solo para ADMIN
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
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
