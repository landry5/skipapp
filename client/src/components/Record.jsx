import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function Record() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    level: '',
    location: '', // New field for storing location
    images: [],
  });
  const [isNew, setIsNew] = useState(true);
  const [imagePreviews, setImagePreviews] = useState([]); // Array to hold image previews
  const params = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      const id = params.id?.toString() || undefined;
      if (!id) return;
      setIsNew(false);
      const response = await fetch(
        `https://skipapp.onrender.com/record/${params.id.toString()}`
      );
      if (!response.ok) {
        const message = `An error has occurred: ${response.statusText}`;
        console.error(message);
        return;
      }
      const record = await response.json();
      if (!record) {
        console.warn(`Record with id ${id} not found`);
        navigate('/');
        return;
      }
      setForm(record);
    }
    fetchData();
    return;
  }, [params.id, navigate]);

  function updateForm(value) {
    return setForm((prev) => {
      return { ...prev, ...value };
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    const person = { ...form };
    try {
      let response;
      if (isNew) {
        response = await fetch('https://skipapp.onrender.com/record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(person),
        });
      } else {
        response = await fetch(`https://skipapp.onrender.com/record/${params.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(person),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('A problem occurred with your fetch operation: ', error);
    } finally {
      setForm({ name: '', description: '', level: '', location: '', images: []});
      navigate('/');
    }
  }

  // Function to get the user's current location
  function handleGetLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateForm({ location: `${latitude}, ${longitude}` });
      },
      (error) => {
        console.error('Error getting location: ', error);
        alert('Unable to retrieve location.');
      }
    );
  }

  // Handle image upload (allow up to 4 images)
  //function handleImageUpload(e) {
   // const files = Array.from(e.target.files); // Get all selected files
   // const validFiles = files.slice(0, 4 - imagePreviews.length); // Limit to 4 images
   // const newImagePreviews = validFiles.map((file) =>
   //   URL.createObjectURL(file)
   // );
   // setImagePreviews((prev) => [...prev, ...newImagePreviews]);
  //}

 ///////////////////////////updated image upload

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files); // Get all selected files
    const validFiles = files.slice(0, 4 - imagePreviews.length); // Limit to 4 images
  
    const uploadedImageUrls = await Promise.all(
      validFiles.map(async (file) => {
        const imageUrl = await uploadImage(file);
        return imageUrl;
      })
    );
  
    // Filter out any null URLs (failed uploads)
    const successfulUploads = uploadedImageUrls.filter((url) => url !== null);
  
    setImagePreviews((prev) => [...prev, ...successfulUploads]);
    //update2
    updateForm({ images: [...imagePreviews, ...successfulUploads] });
    //update2 ends here
  }
  
  async function uploadImage(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile); // Assuming your backend expects this field name
  
    try {
      const response = await fetch('https://skipapp.onrender.com/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload image');
      }
      return result.imageUrl; // Assuming your backend returns the URL of the uploaded image
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
      return null;
    }
  }
  

  ///////////////////////update ends here

  // Remove a specific image preview workded before
  //function removeImage(index) {
  //  setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  //}
  //above worked just fine. afew tweeks down bellow
  function removeImage(index) {
    setImagePreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      updateForm({ images: newPreviews });
      return newPreviews;
    });
  }
  //above update end here


  return (
    <>
      <h3 className="text-lg font-semibold p-4">
        Create/Update Object Listing
      </h3>
      <form
        onSubmit={onSubmit}
        className="border rounded-lg overflow-hidden p-4">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-slate-900/10 pb-12 md:grid-cols-2">
          <div>
            <h2 className="text-base font-semibold leading-7 text-slate-900">
              Object Info
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              This information will be displayed publicly so be careful what you
              share.
            </p>

            {/* Image Previews Section */}

            <div className="flex flex-wrap gap-4 w-60">
              {imagePreviews.length > 0 ? (
                imagePreviews.map((image, index) => (
                  <div
                    key={index}
                    className="relative w-20 h-20 border rounded">
                    <img
                      src={image}
                      alt={`Uploaded ${index}`}
                      className="w-full h-full object-cover rounded"
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1"
                      onClick={() => removeImage(index)}>
                      X
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No Images Uploaded</p>
              )}
            </div>

            {/* end Image Previews Section */}
          </div>

          {/* Form Section */}

          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 ">
            <div className="sm:col-span-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-6 text-slate-900">
                Title
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="block w-full border rounded-md py-1.5 px-3 text-slate-900"
                  placeholder="Fabric Sofa"
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                />
              </div>
            </div>
            <div className="sm:col-span-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium leading-6 text-slate-900">
                Description
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="description"
                  id="description"
                  className="block w-full border rounded-md py-1.5 px-3 text-slate-900"
                  placeholder="Used Good condition"
                  value={form.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                />
              </div>
            </div>
            <div>
              <fieldset className="mt-4">
                <legend className="sr-only">Position Options</legend>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="positionAvailable"
                      name="positionOptions"
                      type="radio"
                      value="Available"
                      className="h-4 w-4 border-slate-300 text-slate-600"
                      checked={form.level === 'Available'}
                      onChange={(e) => updateForm({ level: e.target.value })}
                    />
                    <label
                      htmlFor="positionAvailable"
                      className="ml-3 text-sm text-slate-900">
                      Available
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="positionInquired"
                      name="positionOptions"
                      type="radio"
                      value="Inquired"
                      className="h-4 w-4 border-slate-300 text-slate-600"
                      checked={form.level === 'Inquired'}
                      onChange={(e) => updateForm({ level: e.target.value })}
                    />
                    <label
                      htmlFor="positionInquired"
                      className="ml-3 text-sm text-slate-900">
                      Inquired
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="positionTaken"
                      name="positionOptions"
                      type="radio"
                      value="Taken"
                      className="h-4 w-4 border-slate-300 text-slate-600"
                      checked={form.level === 'Taken'}
                      onChange={(e) => updateForm({ level: e.target.value })}
                    />
                    <label
                      htmlFor="positionTaken"
                      className="ml-3 text-sm text-slate-900">
                      Taken
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>
            <div className="sm:col-span-4">
              <label
                htmlFor="location"
                className="block text-sm font-medium leading-6 text-slate-900">
                Location
              </label>
              <div className="mt-2 flex items-center">
                <input
                  type="text"
                  name="location"
                  id="location"
                  className="block flex-1 border rounded-md py-1.5 px-3 text-slate-900"
                  placeholder="Click 'Get Location' to autofill"
                  value={form.location}
                  onChange={(e) => updateForm({ location: e.target.value })}
                  readOnly
                />
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="ml-4 inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-md text-sm text-slate-900 bg-white hover:bg-slate-100">
                  Get Location
                </button>
              </div>
            </div>

            {/* Upload Images */}
            <div className="sm:col-span-4">
              <label htmlFor="images" className="block text-sm font-medium">
                Upload Images (Max 4)
              </label>
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="mt-2"
              />
            </div>
          </div>
        </div>
        <input
          type="submit"
          value="Save Object Listing"
          className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded"
        />
      </form>
    </>
  );
}