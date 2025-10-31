import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

const ReceiptGroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [targetGroupId, setTargetGroupId] = useState('');

  useEffect(() => {
    fetchGroupData();
    fetchAllGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'receiptGroups', groupId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGroup({ id: docSnap.id, ...data });
        setPhotos(data.photos || []);
      } else {
        setError('Group not found');
      }
    } catch (err) {
      setError('Failed to fetch group: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllGroups = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'receiptGroups'));
      const groupsData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(g => g.id !== groupId);
      setAllGroups(groupsData);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const uploadPromises = files.map(async (file) => {
        const storageRef = ref(storage, `receipts/${groupId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return { url, path: storageRef.fullPath, uploadedAt: new Date().toISOString() };
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      const updatedPhotos = [...photos, ...uploadedPhotos];

      await updateDoc(doc(db, 'receiptGroups', groupId), {
        photos: updatedPhotos
      });

      setPhotos(updatedPhotos);
    } catch (err) {
      setError('Failed to upload photos: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoIndex) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const photoToDelete = photos[photoIndex];
      const storageRef = ref(storage, photoToDelete.path);
      await deleteObject(storageRef);

      const updatedPhotos = photos.filter((_, index) => index !== photoIndex);
      await updateDoc(doc(db, 'receiptGroups', groupId), {
        photos: updatedPhotos
      });

      setPhotos(updatedPhotos);
    } catch (err) {
      setError('Failed to delete photo: ' + err.message);
    }
  };

  const handlePhotoSelection = (index) => {
    setSelectedPhotos(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  };

  const handleMovePhotos = async () => {
    if (!targetGroupId || selectedPhotos.length === 0) {
      setError('Please select a target group and photos to move');
      return;
    }

    try {
      const photosToMove = selectedPhotos.map(index => photos[index]);
      const remainingPhotos = photos.filter((_, index) => !selectedPhotos.includes(index));

      const targetDocRef = doc(db, 'receiptGroups', targetGroupId);
      const targetDocSnap = await getDoc(targetDocRef);
      const targetPhotos = targetDocSnap.data()?.photos || [];

      await updateDoc(doc(db, 'receiptGroups', groupId), {
        photos: remainingPhotos
      });

      await updateDoc(targetDocRef, {
        photos: [...targetPhotos, ...photosToMove]
      });

      setPhotos(remainingPhotos);
      setSelectedPhotos([]);
      setShowMoveModal(false);
      setTargetGroupId('');
    } catch (err) {
      setError('Failed to move photos: ' + err.message);
    }
  };

  const handleDownloadPhoto = async (photo, index) => {
    try {
      // Fetch the image with cors mode
      const response = await fetch(photo.url, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${group.name}-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download photo: ' + err.message);
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedPhotos.length === 0) {
      setError('Please select photos to download');
      return;
    }

    for (let i = 0; i < selectedPhotos.length; i++) {
      const index = selectedPhotos[i];
      await handleDownloadPhoto(photos[index], index);
      // Small delay between downloads
      if (i < selectedPhotos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const handleDownloadAll = async () => {
    if (photos.length === 0) {
      setError('No photos to download');
      return;
    }

    for (let i = 0; i < photos.length; i++) {
      await handleDownloadPhoto(photos[i], i);
      // Small delay between downloads
      if (i < photos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      // Deselect all
      setSelectedPhotos([]);
    } else {
      // Select all
      setSelectedPhotos(photos.map((_, index) => index));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPhotos.length === 0) {
      setError('Please select photos to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedPhotos.length} photo(s)?`)) {
      return;
    }

    try {
      // Delete from storage
      const deletePromises = selectedPhotos.map(index => {
        const photoToDelete = photos[index];
        const storageRef = ref(storage, photoToDelete.path);
        return deleteObject(storageRef);
      });

      await Promise.all(deletePromises);

      // Update Firestore
      const remainingPhotos = photos.filter((_, index) => !selectedPhotos.includes(index));
      await updateDoc(doc(db, 'receiptGroups', groupId), {
        photos: remainingPhotos
      });

      setPhotos(remainingPhotos);
      setSelectedPhotos([]);
    } catch (err) {
      setError('Failed to delete photos: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!group) {
    return <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">Group not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard/receipts')}
          className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Groups
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{group.friendlyName}</h1>
            <p className="text-gray-600 mt-2">Name: {group.name}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => document.getElementById('fileInput').click()}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {uploading ? 'Uploading...' : 'Upload Photos'}
            </button>
            {photos.length > 0 && (
              <>
                <button
                  onClick={handleSelectAll}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  {selectedPhotos.length === photos.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleDownloadAll}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download All ({photos.length})
                </button>
              </>
            )}
            {selectedPhotos.length > 0 && (
              <>
                <button
                  onClick={handleDownloadSelected}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Selected ({selectedPhotos.length})
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Selected ({selectedPhotos.length})
                </button>
                <button
                  onClick={() => setShowMoveModal(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Move Selected ({selectedPhotos.length})
                </button>
              </>
            )}
            <input
              id="fileInput"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h3>
          <p className="text-gray-700 mb-6">Upload photos to get started.</p>
          <button
            onClick={() => document.getElementById('fileInput').click()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
          >
            Upload Photos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                selectedPhotos.includes(index) ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              <div className="relative">
                <img
                  src={photo.url}
                  alt="Receipt"
                  className="w-full h-48 object-cover rounded-t-lg cursor-pointer"
                  onClick={() => handlePhotoSelection(index)}
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPhotos.includes(index)}
                      onChange={() => handlePhotoSelection(index)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Select</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownloadPhoto(photo, index)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Download photo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete photo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(photo.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Move Photos Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowMoveModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Move Photos to Another Group</h3>
              <button onClick={() => setShowMoveModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Target Group</label>
                <select
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a group...</option>
                  {allGroups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.friendlyName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm">
                Moving {selectedPhotos.length} photo(s) to the selected group.
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMovePhotos}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Move Photos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptGroupDetail;
