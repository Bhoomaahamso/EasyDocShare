import { useState } from "react";
import { Input } from "../ui/input";
import { useForm, useFieldArray } from "react-hook-form";

function FormElement() {
  const { register, handleSubmit, control } = useForm();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "dynamicFields",
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  const [itemName, setItemName] = useState("");
  return (
    <div className="border-t-2 border-t-black my-4 space-y-4">
      <h1>1. {itemName || "(Item Name)"}</h1>
      {/* select */}
      {/* <div className="">
        <h2>Item Name</h2>
        <Input value={itemName} onChange={(e) => setItemName(e.target.value)} />
      </div>
      <div className="">
        <h2>Item Desc</h2>
        <Input />
      </div> */}
      <div className="">
        <form onSubmit={handleSubmit(onSubmit)}>
          {fields.map((field, index) => (
            <div key={field.id}>
              {/* {console.log(field)} */}
              <input
                type="text"
                {...register(`dynamicFields.${index}.fieldName`)}
                placeholder="Field Name"
              />
              <input
                type="text"
                {...register(`dynamicFields.${index}.fieldValue`)}
                placeholder="Field Value"
              />
            
              <button type="button" onClick={() => remove(index)}>
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => append({ fieldName: "", fieldValue: "" })}
          >
            Add Field
          </button>

          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
}
export default FormElement;
