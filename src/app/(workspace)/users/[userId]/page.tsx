"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FormField } from "@/components/forms/form-field";
import { FormActions } from "@/components/forms/form-actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DetailLoadingSkeleton } from "@/components/feedback/loading-state";
import { AccessDenied } from "@/components/access/access-denied";
import { RequirePermission } from "@/components/access/require-permission";
import { PERMISSIONS } from "@/lib/access/permissions";
import { useUser, useUpdateUser } from "@/features/users/hooks/use-users";
import {
  userUpdateSchema,
  type UserUpdateFormValues,
} from "@/features/users/schemas/user.schema";

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;
  const router = useRouter();

  const { data: user, isLoading, isError } = useUser(userId);
  const updateMutation = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserUpdateFormValues>({
    resolver: zodResolver(userUpdateSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        role: user.role,
        status: user.status,
      });
    }
  }, [user, reset]);

  if (isLoading) {
    return (
      <DashboardShell>
        <DetailLoadingSkeleton />
      </DashboardShell>
    );
  }

  if (isError || !user) {
    return (
      <DashboardShell>
        <AccessDenied description="User record not found or access denied." />
      </DashboardShell>
    );
  }

  const onSubmit = (values: UserUpdateFormValues) => {
    updateMutation.mutate(
      {
        id: user.id,
        updates: values,
      },
      {
        onSuccess: () => {
          router.push("/users");
        },
      }
    );
  };

  return (
    <RequirePermission permission={PERMISSIONS.USER_MANAGE}>
      <DashboardShell>
        <PageHeader
          title={`Edit User Access: ${user.name}`}
          description={`User ID: ${user.id} • ${user.email}`}
          breadcrumbs={[
            { label: "Users", href: "/users" },
            { label: user.name },
          ]}
          actions={
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/users">
                <ArrowLeft size={15} /> Back to Users
              </Link>
            </Button>
          }
        />

        <div className="max-w-xl">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <FormField label="Full Name" required error={errors.name?.message}>
                  <Input {...register("name")} />
                </FormField>

                <FormField label="Email Address">
                  <Input value={user.email} disabled className="bg-slate-50 cursor-not-allowed" />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Role Assignment" error={errors.role?.message}>
                    <Select {...register("role")}>
                      <option value="STUDENT">Student</option>
                      <option value="MENTOR">Mentor</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                  </FormField>

                  <FormField label="Account Status" error={errors.status?.message}>
                    <Select {...register("status")}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive (Disabled)</option>
                    </Select>
                  </FormField>
                </div>

                {updateMutation.isError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    {updateMutation.error instanceof Error
                      ? updateMutation.error.message
                      : "Failed to update user access."}
                  </div>
                )}

                <FormActions
                  submitLabel="Save Changes"
                  loadingLabel="Saving..."
                  isLoading={updateMutation.isPending}
                  onCancel={() => router.push("/users")}
                />
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    </RequirePermission>
  );
}
