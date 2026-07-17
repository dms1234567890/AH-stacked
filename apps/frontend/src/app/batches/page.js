'use client';
import { useState } from 'react';
import { useBatches, useCreateBatch, useUpdateBatch, useDeleteBatch } from '@/lib/hooks';
import { useSubjects } from '@/lib/hooks';
export default function BatchesPage() {
    const [activeSection, setActiveSection] = useState('batch-manage');
    const { data: batches, isLoading, isError, error, refetch } = useBatches();
    const { data: subjects } = useSubjects();
    const createMutation = useCreateBatch();
    const updateMutation = useUpdateBatch();
    const deleteMutation = useDeleteBatch();
    // Add batch form state
    const [newBatchName, setNewBatchName] = useState('');
    const [newBatchSubjects, setNewBatchSubjects] = useState([]);
    const [newBatchRoom, setNewBatchRoom] = useState('');
    const [addStep, setAddStep] = useState(1);
    // Edit batch form state
    const [editBatchId, setEditBatchId] = useState('');
    const [editBatchName, setEditBatchName] = useState('');
    const [editBatchRoom, setEditBatchRoom] = useState('');
    const [editBatchSubjects, setEditBatchSubjects] = useState([]);
    // Delete batch state
    const [deleteBatchId, setDeleteBatchId] = useState('');
    const [deleteAction, setDeleteAction] = useState('prompt');
    const [shiftTargetBatch, setShiftTargetBatch] = useState('');
    const renderLoading = () => (<div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span className="ml-3 text-gray-600">Loading batches...</span>
    </div>);
    const renderError = () => (<div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-red-800 font-medium">Failed to load data</h3>
          <p className="text-red-600 text-sm mt-1">{error?.message || 'An unexpected error occurred'}</p>
        </div>
        <button onClick={() => refetch()} className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded text-sm font-medium">Retry</button>
      </div>
    </div>);
    const selectedBatch = batches?.find((b) => b.id === editBatchId);
    const handleCreateBatch = async () => {
        if (!newBatchName.trim())
            return;
        try {
            await createMutation.mutateAsync({
                name: newBatchName.trim(),
                subjects: newBatchSubjects,
                classRoom: newBatchRoom.trim() || undefined,
            });
            setNewBatchName('');
            setNewBatchSubjects([]);
            setNewBatchRoom('');
            setAddStep(1);
            refetch();
        }
        catch (err) {
            console.error('Create batch error:', err);
        }
    };
    const handleUpdateBatch = async () => {
        if (!editBatchId)
            return;
        try {
            await updateMutation.mutateAsync({
                id: editBatchId,
                data: {
                    name: editBatchName.trim(),
                    classRoom: editBatchRoom.trim() || undefined,
                    subjects: editBatchSubjects,
                },
            });
            refetch();
        }
        catch (err) {
            console.error('Update batch error:', err);
        }
    };
    const handleDeleteBatch = async () => {
        if (!deleteBatchId)
            return;
        try {
            await deleteMutation.mutateAsync(deleteBatchId);
            setDeleteBatchId('');
            setDeleteAction('prompt');
            refetch();
        }
        catch (err) {
            console.error('Delete batch error:', err);
        }
    };
    const toggleSubject = (subjectId, list, setter) => {
        if (list.includes(subjectId)) {
            setter(list.filter((id) => id !== subjectId));
        }
        else {
            setter([...list, subjectId]);
        }
    };
    return (<div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl p-6 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Batch Management</h1>
          <div className="flex gap-2">
            <button onClick={() => refetch()} className="text-blue-600 hover:underline text-sm">Refresh</button>
            <button onClick={() => window.location.href = '/dashboard'} className="text-blue-600 hover:underline text-sm">← Back to Dashboard</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setActiveSection('add')} className={`px-4 py-2 rounded font-medium ${activeSection === 'add' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
            ADD NEW BATCH
          </button>
          <button onClick={() => setActiveSection('edit')} className={`px-4 py-2 rounded font-medium ${activeSection === 'edit' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
            EDIT BATCH DETAILS
          </button>
          <button onClick={() => setActiveSection('delete')} className={`px-4 py-2 rounded font-medium ${activeSection === 'delete' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
            DELETE BATCH
          </button>
          <button onClick={() => setActiveSection('list')} className={`px-4 py-2 rounded font-medium ${activeSection === 'list' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
            ALL BATCHES
          </button>
        </div>

        {/* List Batches */}
        {activeSection === 'list' && (<div className="p-4 bg-gray-50 rounded-lg">
            {isLoading && renderLoading()}
            {isError && renderError()}
            {batches && batches.length === 0 && <p className="text-gray-500 text-center py-8">No batches found.</p>}
            {batches && batches.length > 0 && (<div className="grid gap-3">
                {batches.map((batch) => (<div key={batch.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{batch.name}</h3>
                        {batch.classRoom && <p className="text-sm text-gray-500">Room: {batch.classRoom}</p>}
                        <p className="text-xs text-gray-400 mt-1">{batch.studentCount} students</p>
                      </div>
                      <div className="text-right">
                        <div className="flex flex-wrap gap-1 justify-end">
                          {batch.subjects?.map((s) => (<span key={s.id} className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded">{s.name}</span>))}
                        </div>
                      </div>
                    </div>
                  </div>))}
              </div>)}
          </div>)}

        {/* Add Batch */}
        {activeSection === 'add' && (<div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-4">Add New Batch</h3>

            {addStep === 1 && (<div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name *</label>
                <input type="text" value={newBatchName} onChange={(e) => setNewBatchName(e.target.value)} className="border p-2 rounded w-full mb-3" placeholder="Enter batch name"/>
                <button onClick={() => setAddStep(2)} disabled={!newBatchName.trim()} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">Next: Choose Subjects</button>
              </div>)}

            {addStep === 2 && (<div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Subjects</label>
                {subjects && subjects.length > 0 ? (<div className="border p-2 rounded mb-3 bg-white max-h-48 overflow-y-auto grid grid-cols-2 gap-1">
                    {subjects.map((subject) => (<label key={subject.id} className="flex items-center gap-2 text-sm p-1 hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={newBatchSubjects.includes(subject.id)} onChange={() => toggleSubject(subject.id, newBatchSubjects, setNewBatchSubjects)}/>
                        {subject.name}
                      </label>))}
                  </div>) : (<p className="text-sm text-gray-500 mb-3">Loading subjects...</p>)}
                <div className="flex gap-2">
                  <button onClick={() => setAddStep(1)} className="bg-gray-500 text-white px-4 py-2 rounded">Back</button>
                  <button onClick={() => setAddStep(3)} className="bg-blue-600 text-white px-4 py-2 rounded">Next: Room Number</button>
                </div>
              </div>)}

            {addStep === 3 && (<div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                <input type="text" value={newBatchRoom} onChange={(e) => setNewBatchRoom(e.target.value)} className="border p-2 rounded w-full mb-3" placeholder="Enter room number (optional)"/>
                <div className="flex gap-2">
                  <button onClick={() => setAddStep(2)} className="bg-gray-500 text-white px-4 py-2 rounded">Back</button>
                  <button onClick={handleCreateBatch} disabled={createMutation.isPending} className="bg-green-600 text-white px-6 py-2 rounded font-medium disabled:opacity-50">
                    {createMutation.isPending ? 'Saving...' : 'Save Batch'}
                  </button>
                </div>
                {createMutation.isSuccess && <p className="text-green-600 text-sm mt-2">Batch created successfully!</p>}
                {createMutation.isError && <p className="text-red-600 text-sm mt-2">Failed: {createMutation.error?.message}</p>}
              </div>)}
          </div>)}

        {/* Edit Batch */}
        {activeSection === 'edit' && (<div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold mb-4">Edit Batch Details</h3>
            {isLoading ? renderLoading() : (<>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
                <select value={editBatchId} onChange={(e) => {
                    const id = e.target.value;
                    setEditBatchId(id);
                    const b = batches?.find((batch) => batch.id === id);
                    if (b) {
                        setEditBatchName(b.name);
                        setEditBatchRoom(b.classRoom || '');
                        setEditBatchSubjects(b.subjects?.map((s) => s.id) || []);
                    }
                }} className="border p-2 rounded w-full mb-3">
                  <option value="">Select batch</option>
                  {batches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>

                {editBatchId && (<div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                        <input type="text" value={editBatchName} onChange={(e) => setEditBatchName(e.target.value)} className="border p-2 rounded w-full"/>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                        <input type="text" value={editBatchRoom} onChange={(e) => setEditBatchRoom(e.target.value)} className="border p-2 rounded w-full"/>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                      {subjects && subjects.length > 0 ? (<div className="border p-2 rounded bg-white max-h-48 overflow-y-auto grid grid-cols-2 gap-1">
                          {subjects.map((subject) => (<label key={subject.id} className="flex items-center gap-2 text-sm p-1 hover:bg-gray-50 cursor-pointer">
                              <input type="checkbox" checked={editBatchSubjects.includes(subject.id)} onChange={() => toggleSubject(subject.id, editBatchSubjects, setEditBatchSubjects)}/>
                              {subject.name}
                            </label>))}
                        </div>) : <p className="text-sm text-gray-500">Loading subjects...</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleUpdateBatch} disabled={updateMutation.isPending} className="bg-green-600 text-white px-6 py-2 rounded font-medium disabled:opacity-50">
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button onClick={() => { setEditBatchId(''); setEditBatchName(''); setEditBatchRoom(''); setEditBatchSubjects([]); }} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
                    </div>
                    {updateMutation.isSuccess && <p className="text-green-600 text-sm mt-2">Batch updated successfully!</p>}
                    {updateMutation.isError && <p className="text-red-600 text-sm mt-2">Failed: {updateMutation.error?.message}</p>}
                  </div>)}
              </>)}
          </div>)}

        {/* Delete Batch */}
        {activeSection === 'delete' && (<div className="p-4 bg-red-50 rounded-lg">
            <h3 className="font-semibold mb-4">Delete Batch</h3>
            {isLoading ? renderLoading() : (<>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch to Delete</label>
                <select value={deleteBatchId} onChange={(e) => setDeleteBatchId(e.target.value)} className="border p-2 rounded w-full mb-3">
                  <option value="">Select batch</option>
                  {batches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>

                {deleteBatchId && (<div>
                    <div className="bg-red-100 border border-red-300 rounded p-3 mb-3 text-sm text-red-800">
                      <strong>Warning:</strong> Deleting this batch will affect associated students.
                    </div>
                    <button onClick={handleDeleteBatch} disabled={deleteMutation.isPending} className="bg-red-600 text-white px-6 py-2 rounded font-medium disabled:opacity-50">
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete Batch'}
                    </button>
                    {deleteMutation.isSuccess && <p className="text-green-600 text-sm mt-2">Batch deleted successfully!</p>}
                    {deleteMutation.isError && <p className="text-red-600 text-sm mt-2">Failed: {deleteMutation.error?.message}</p>}
                  </div>)}
              </>)}
          </div>)}
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map