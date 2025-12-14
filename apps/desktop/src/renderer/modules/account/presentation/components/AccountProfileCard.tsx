/**
 * AccountProfileCard Component
 *
 * 账户资料卡片
 * Story 11-6: Auxiliary Modules
 */

import { useState } from 'react';
import { User, Mail, MapPin, Globe, Calendar, Edit2, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export interface AccountProfile {
  uuid: string;
  email: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  language?: string;
  createdAt?: Date;
  isVerified?: boolean;
  isPremium?: boolean;
}

interface AccountProfileCardProps {
  profile: AccountProfile;
  onEdit?: () => void;
  onAvatarChange?: () => void;
}

export function AccountProfileCard({
  profile,
  onEdit,
  onAvatarChange,
}: AccountProfileCardProps) {
  const [imageError, setImageError] = useState(false);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">个人资料</CardTitle>
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit2 className="h-4 w-4 mr-1" />
              编辑
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 头像和基本信息 */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              {profile.avatarUrl && !imageError ? (
                <AvatarImage
                  src={profile.avatarUrl}
                  alt={profile.displayName || profile.username}
                  onError={() => setImageError(true)}
                />
              ) : null}
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {getInitials(profile.displayName, profile.email)}
              </AvatarFallback>
            </Avatar>
            {onAvatarChange && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-0 right-0 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onAvatarChange}
              >
                <Camera className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold truncate">
                {profile.displayName || profile.username || '未设置昵称'}
              </h3>
              {profile.isVerified && (
                <Badge variant="secondary" className="shrink-0">
                  已认证
                </Badge>
              )}
              {profile.isPremium && (
                <Badge className="shrink-0 bg-amber-500 hover:bg-amber-600">
                  高级会员
                </Badge>
              )}
            </div>
            {profile.username && profile.displayName && (
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            )}
            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* 详细信息 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{profile.email}</span>
          </div>

          {profile.location && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{profile.location}</span>
            </div>
          )}

          {profile.timezone && (
            <div className="flex items-center gap-3 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{profile.timezone}</span>
            </div>
          )}

          {profile.createdAt && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {format(new Date(profile.createdAt), 'yyyy年M月d日加入', {
                  locale: zhCN,
                })}
              </span>
            </div>
          )}
        </div>

        {/* 语言设置 */}
        {profile.language && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">界面语言</span>
              <span>{profile.language === 'zh-CN' ? '简体中文' : 'English'}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AccountProfileCard;
