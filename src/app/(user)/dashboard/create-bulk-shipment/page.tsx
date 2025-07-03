"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ADDRESS_TYPE } from "@prisma/client";
import { AlertCircle, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AddAddressModal } from "~/components/AddAddressModal";
import { FieldError } from "~/components/FieldError";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";
import { Label } from "~/components/ui/label";
import { type TShipmentSchema, submitShipmentSchema } from "~/schemas/order";
import { api } from "~/trpc/react";

export default function CreateShipmentPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOriginAddressModal, setShowOriginAddressModal] = useState(false);
  const [autofilledAddressDetails, setAutofilledAddressDetails] = useState<
    NonNullable<typeof userAddresses>[number] | undefined
  >(undefined);
  const [originZipCodeFilter, setOriginZipCodeFilter] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TShipmentSchema>({
    resolver: zodResolver(submitShipmentSchema),
  });

  const {
    data: warehouseAddresses,
    isLoading: isLoadingWarehouseAddresses,
    refetch: refetchWarehouseAddresses,
  } = api.address.getAddresses.useQuery({ type: ADDRESS_TYPE.Warehouse });
  const {
    data: userAddresses,
    isLoading: isLoadingUserAddresses,
    refetch: refetchUserAddresses,
  } = api.address.getAddresses.useQuery({ type: ADDRESS_TYPE.User });

  const addAddressMutation = api.address.createAddress.useMutation();

  const [filteredWarehouseAddresses, setFilteredWarehouseAddresses] = useState<
    typeof warehouseAddresses | undefined
  >(undefined);

  useEffect(() => {
    if (warehouseAddresses) {
      setFilteredWarehouseAddresses(warehouseAddresses);
    }
  }, [warehouseAddresses]);

  useEffect(() => {
    if (warehouseAddresses) {
      setFilteredWarehouseAddresses(
        warehouseAddresses.filter((address) =>
          String(address.zip_code).includes(originZipCodeFilter)
        )
      );
    }
  }, [warehouseAddresses, originZipCodeFilter]);

  const destinationZipCode = watch("destinationZipCode");
  const recipientName = watch("recipientName");

  useEffect(() => {
    if (userAddresses && recipientName) {
      let potentialAddresses = userAddresses.filter(
        (address) => address.name === recipientName
      );

      if (destinationZipCode) {
        potentialAddresses = potentialAddresses.filter(
          (address) => String(address.zip_code) === destinationZipCode
        );
      }

      if (potentialAddresses.length === 1) {
        const matchedAddress = potentialAddresses[0];
        if (matchedAddress) {
          setValue("destinationAddressId", matchedAddress.address_id);
          setValue("destinationAddressLine", matchedAddress.address_line);
          setValue("destinationZipCode", String(matchedAddress.zip_code));
          setValue("destinationCity", matchedAddress.city);
          setValue("destinationState", matchedAddress.state);
          setAutofilledAddressDetails(matchedAddress);
        }
      } else {
        setValue("destinationAddressId", undefined);
        setAutofilledAddressDetails(undefined);
        if (potentialAddresses.length === 0) {
          setValue("destinationAddressLine", "");
          setValue("destinationCity", "");
          setValue("destinationState", "");
        }
      }
    } else {
      setValue("destinationAddressId", undefined);
      setAutofilledAddressDetails(undefined);
      setValue("destinationAddressLine", "");
      setValue("destinationZipCode", "");
      setValue("destinationCity", "");
      setValue("destinationState", "");
    }
  }, [userAddresses, destinationZipCode, recipientName, setValue]);

  const createShipmentMutation = api.order.createShipment.useMutation({
    onSuccess: () => {
      setIsLoading(false);
      router.push("/dashboard/");
    },
    onError(err) {
      setErrorMessage(err.message);
      setIsLoading(false);
    },
  });

  const onSubmit = async (data: TShipmentSchema) => {
    setIsLoading(true);
    setErrorMessage("");

    let finalDestinationAddressId = data.destinationAddressId;

    if (finalDestinationAddressId && autofilledAddressDetails) {
      if (
        data.destinationAddressLine !== autofilledAddressDetails.address_line ||
        Number(data.destinationZipCode) !== autofilledAddressDetails.zip_code ||
        data.destinationCity !== autofilledAddressDetails.city ||
        data.destinationState !== autofilledAddressDetails.state
      ) {
        finalDestinationAddressId = undefined;
      }
    }

    if (!finalDestinationAddressId) {
      try {
        const newAddress = await addAddressMutation.mutateAsync({
          name: data.recipientName,
          addressLine: data.destinationAddressLine,
          zipCode: Number(data.destinationZipCode),
          city: data.destinationCity,
          state: data.destinationState,
          type: ADDRESS_TYPE.User,
        });
        finalDestinationAddressId = newAddress.address_id;
      } catch (error) {
        let message = "Failed to add new destination address.";
        if (error instanceof Error) {
          message = error.message;
        }
        setErrorMessage(message);
        setIsLoading(false);
        return;
      }
    }

    createShipmentMutation.mutate({
      ...data,
      destinationAddressId: finalDestinationAddressId,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full bg-blue-100/20">
        <AddAddressModal
          isOpen={showOriginAddressModal}
          onClose={() => setShowOriginAddressModal(false)}
          onAddressAdded={() => refetchWarehouseAddresses()}
          addressType={ADDRESS_TYPE.Warehouse}
        />
        <CardHeader>
          <h1 className="text-center font-semibold text-2xl text-blue-950">
            Create Shipment
          </h1>
          <p className="text-center text-blue-900 text-sm">
            Enter the shipment details.
          </p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 text-blue-950"
          >
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="mb-10 flex gap-10">
              <div className="space-y-4">
                <Label>Recipient Name</Label>
                <Input {...register("recipientName")} disabled={isLoading} />
                <FieldError message={errors.recipientName?.message} />
              </div>
              <div className="mb-10 flex flex-wrap gap-10">
                <div className="space-y-2">
                  <Label>Recipient Mobile Number</Label>
                  <InputOTP
                    maxLength={10}
                    value={watch("recipientMobile")}
                    onChange={(val) => setValue("recipientMobile", val)}
                    disabled={isLoading}
                    pattern="\d*"
                    inputMode="numeric"
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  <FieldError message={errors.recipientMobile?.message} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="font-bold">Destination Address</Label>
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Address Line</Label>
                  <Input
                    {...register("destinationAddressLine")}
                    disabled={isLoading}
                  />
                  <FieldError
                    message={errors.destinationAddressLine?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zip Code</Label>
                  <Input
                    {...register("destinationZipCode")}
                    disabled={isLoading}
                  />
                  <FieldError message={errors.destinationZipCode?.message} />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    {...register("destinationCity")}
                    disabled={isLoading}
                  />
                  <FieldError message={errors.destinationCity?.message} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    {...register("destinationState")}
                    disabled={isLoading}
                  />
                  <FieldError message={errors.destinationState?.message} />
                </div>
              </div>
              <FieldError message={errors.destinationAddressId?.message} />
            </div>

            <div className="space-y-4">
              <Label className="font-bold">Origin Address</Label>
              <Input
                placeholder="Search by Pin Code"
                onChange={(e) => setOriginZipCodeFilter(e.target.value)}
                className="mb-2"
              />
              {isLoadingWarehouseAddresses ? (
                <p>Loading origin addresses...</p>
              ) : (
                <div className="flex gap-4 overflow-x-auto p-4">
                  {filteredWarehouseAddresses?.map((address) => (
                    <Card
                      key={address.address_id}
                      className={`h-48 w-96 flex-shrink-0 cursor-pointer bg-blue-100 hover:bg-blue-200 ${
                        watch("originAddressId") === address.address_id
                          ? "border-blue-500 ring-1 ring-blue-500"
                          : ""
                      }`}
                      onClick={() =>
                        setValue("originAddressId", address.address_id)
                      }
                    >
                      <CardHeader>
                        <h3 className="font-semibold">{address.name}</h3>
                      </CardHeader>
                      <CardContent>
                        <p>{address.address_line}</p>
                        <p>
                          {address.city}, {address.state} - {address.zip_code}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-48 w-96 bg-blue-200 hover:bg-blue-300"
                    onClick={() => setShowOriginAddressModal(true)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Origin
                    Address
                  </Button>
                </div>
              )}
              <FieldError message={errors.originAddressId?.message} />
            </div>

            <div className="space-y-4">
              <Label className="font-bold">Package Details</Label>
              <div className="mb-10 grid grid-cols-2 gap-10 p-4">
                <div className="space-y-2">
                  <Label>Package Weight</Label>
                  <Input
                    placeholder="Package Weight (in kg)"
                    type="number"
                    step="any"
                    {...register("packageWeight", {
                      valueAsNumber: true,
                    })}
                  />
                  <FieldError message={errors.packageWeight?.message} />
                </div>
                <div className="space-y-2">
                  <Label>Package Height</Label>
                  <Input
                    placeholder="Package Height (in cm)"
                    type="number"
                    step="any"
                    {...register("packageHeight", {
                      valueAsNumber: true,
                    })}
                  />
                  <FieldError message={errors.packageHeight?.message} />
                </div>
                <div className="space-y-2">
                  <Label>Package Breadth</Label>
                  <Input
                    placeholder="Package Breadth (in cm)"
                    type="number"
                    step="any"
                    {...register("packageBreadth", {
                      valueAsNumber: true,
                    })}
                  />
                  <FieldError message={errors.packageBreadth?.message} />
                </div>
                <div className="space-y-2">
                  <Label>Package Length</Label>
                  <Input
                    placeholder="Package Length (in cm)"
                    type="number"
                    step="any"
                    {...register("packageLength", {
                      valueAsNumber: true,
                    })}
                  />
                  <FieldError message={errors.packageLength?.message} />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading || createShipmentMutation.isPending
                ? "Creating..."
                : "Create Shipment"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-sm">
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
