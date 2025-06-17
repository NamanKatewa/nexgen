"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitKycSchema, type TKycSchema } from "~/schemas/kyc";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ENTITY_TYPE } from "@prisma/client";
import Link from "next/link";
import { api } from "~/trpc/react";
import { InputOTP, InputOTPSlot } from "~/components/ui/input-otp";

export default function KycFormPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [aadharFrontPreview, setAadharFrontPreview] = useState<string | null>(
    null
  );
  const [aadharBackPreview, setAadharBackPreview] = useState<string | null>(
    null
  );
  const [panFrontPreview, setPanFrontPreview] = useState<string | null>(null);
  const [panBackPreview, setPanBackPreview] = useState<string | null>(null);

  const kycSubmitMutation = api.kyc.kycSubmit.useMutation({
    onSuccess: () => {
      setIsLoading(false);
      router.push("/dashboard/submitted");
    },
    onError: () => {
      setErrorMessage(
        "Something went wrong. Try refreshing and submitting again."
      );
      setIsLoading(false);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TKycSchema>({
    resolver: zodResolver(submitKycSchema),
    defaultValues: {
      gst: false,
      submission_date: new Date(),
    },
  });

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof TKycSchema,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      setValue(fieldName, undefined);
      setPreview(null);
      return;
    }

    setPreview(URL.createObjectURL(file));

    try {
      const base64 = await fileToBase64(file);
      setValue(fieldName, {
        data: base64,
        name: file.name,
        type: file.type,
        size: file.size,
      });
    } catch (err) {
      console.error("Base64 conversion error:", err);
      setErrorMessage("Failed to process image file.");
      setValue(fieldName, undefined);
      setPreview(null);
    }
  };

  const onSubmit = (data: TKycSchema) => {
    setIsLoading(true);
    setErrorMessage("");
    kycSubmitMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-blue-50">
      <Card className="w-full max-w-4xl bg-blue-100/20 shadow-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold text-center text-blue-950">
            KYC Form
          </h1>
          <p className="text-sm text-center text-blue-900">
            Enter your business verification details
          </p>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 text-blue-950"
          >
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Entity Info */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Entity Name</Label>
                <Input {...register("entityName")} disabled={isLoading} />
                {errors.entityName && (
                  <p className="text-sm text-red-600">
                    {errors.entityName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select
                  onValueChange={(val) =>
                    setValue("entityType", val as ENTITY_TYPE)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { label: "Individual", value: "Individual" },
                      { label: "Self Employment", value: "SelfEmployement" },
                      {
                        label: "Proprietorship Firm",
                        value: "ProprietorshipFirm",
                      },
                      {
                        label: "Limited Liability Partnership",
                        value: "LimitedLiabilityParternship",
                      },
                      {
                        label: "Private Limited Company",
                        value: "PrivateLimitedCompany",
                      },
                      {
                        label: "Public Limited Company",
                        value: "PublicLimitedCompany",
                      },
                      { label: "Partnership Firm", value: "PartnershipFirm" },
                    ].map(({ label, value }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.entityType && (
                  <p className="text-sm text-red-600">
                    {errors.entityType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Website URL (optional)</Label>
                <Input {...register("websiteUrl")} disabled={isLoading} />
                {errors.websiteUrl && (
                  <p className="text-sm text-red-600">
                    {errors.websiteUrl.message}
                  </p>
                )}
              </div>
            </div>

            {/* Billing Address */}
            <div className="space-y-2">
              <Label>Billing Address</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Zip Code"
                  type="number"
                  {...register("billingAddress.zipCode", {
                    valueAsNumber: true,
                  })}
                />
                <Input
                  placeholder="City"
                  {...register("billingAddress.city")}
                />
                <Input
                  placeholder="State"
                  {...register("billingAddress.state")}
                />
                <Input
                  placeholder="Address Line"
                  className="md:col-span-2"
                  {...register("billingAddress.addressLine")}
                />
              </div>
              {errors.billingAddress?.addressLine && (
                <p className="text-sm text-red-600">
                  {errors.billingAddress.addressLine.message}
                </p>
              )}
            </div>

            {/* Aadhar Info */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Aadhar Number</Label>
                <InputOTP
                  maxLength={12}
                  value={watch("aadharNumber")}
                  onChange={(val) => setValue("aadharNumber", val)}
                  disabled={isLoading}
                  pattern="\d*"
                  inputMode="numeric"
                >
                  {[0, 1, 2, 3].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                  <span className="px-2">-</span>
                  {[4, 5, 6, 7].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                  <span className="px-2">-</span>
                  {[8, 9, 10, 11].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTP>
                {errors.aadharNumber && (
                  <p className="text-sm text-red-600">
                    {errors.aadharNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Aadhar Front Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(
                      e,
                      "aadharImageFront",
                      setAadharFrontPreview
                    )
                  }
                />
                {aadharFrontPreview && (
                  <img
                    src={aadharFrontPreview}
                    className="w-32 h-32 object-cover border rounded"
                  />
                )}
                {errors.aadharImageFront && (
                  <p className="text-sm text-red-600">
                    {errors.aadharImageFront.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Aadhar Back Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(e, "aadharImageBack", setAadharBackPreview)
                  }
                />
                {aadharBackPreview && (
                  <img
                    src={aadharBackPreview}
                    className="w-32 h-32 object-cover border rounded"
                  />
                )}
                {errors.aadharImageBack && (
                  <p className="text-sm text-red-600">
                    {errors.aadharImageBack.message as string}
                  </p>
                )}
              </div>
            </div>

            {/* PAN Info */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>PAN Number</Label>
                <InputOTP
                  maxLength={10}
                  value={watch("panNumber")}
                  onChange={(val) => setValue("panNumber", val.toUpperCase())}
                  disabled={isLoading}
                  pattern="[A-Z0-9]*"
                  className="uppercase"
                >
                  {[...Array(10)].map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTP>
                {errors.panNumber && (
                  <p className="text-sm text-red-600">
                    {errors.panNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>PAN Front Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(e, "panImageFront", setPanFrontPreview)
                  }
                />
                {panFrontPreview && (
                  <img
                    src={panFrontPreview}
                    className="w-32 h-32 object-cover border rounded"
                  />
                )}
                {errors.panImageFront && (
                  <p className="text-sm text-red-600">
                    {errors.panImageFront.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>PAN Back Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(e, "panImageBack", setPanBackPreview)
                  }
                />
                {panBackPreview && (
                  <img
                    src={panBackPreview}
                    className="w-32 h-32 object-cover border rounded"
                  />
                )}
                {errors.panImageBack && (
                  <p className="text-sm text-red-600">
                    {errors.panImageBack.message as string}
                  </p>
                )}
              </div>
            </div>

            {/* GST */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register("gst")}
                className="h-4 w-4 text-amber-100 bg-blue-950"
              />
              <Label htmlFor="gst">Do you have GST?</Label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading || kycSubmitMutation.isPending
                ? "Submitting..."
                : "Submit KYC"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <Link
              href="/dashboard/support"
              className="text-primary hover:underline"
            >
              Contact Support
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
