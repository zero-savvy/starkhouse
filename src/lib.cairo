
use core::poseidon::PoseidonTrait;
use core::poseidon::poseidon_hash_span;
use core::hash::{HashStateTrait, HashStateExTrait};

#[derive(Drop, Hash)]
struct StructForHash {
    first: felt252,
    second: felt252,
    third: (u32, u32),
    last: bool,
} 

#[derive(Drop)]
struct StructForHashArray {
    first: felt252,
    second: felt252,
    third: Array<felt252>,
}

#[derive(Drop)]
struct StructImage {
    width: u8,
    height: u8,
    R: Array<u8>,
    G: Array<u8>,
    B: Array<u8>,
}

fn main() -> felt252 {
    let orig_image = StructImage {R: array![1,2,2,2,2,2,2], G: array![1,2,2,2,2,2,2], B: array![1,2,2,2,2,2,2], width: 32, height: 432};

    // ------------------------------------
    // Calculate Hash of the ORIGINAL image
    // ------------------------------------
    let mut hasher_orig = PoseidonTrait::new();    
    let orig_image_hash = hasher_orig.update(poseidon_hash_span(orig_image.data.span())).finalize();

    // ---------------------------------------
    // Calculate Hash of the TRANSFORMED image
    // ---------------------------------------
    let mut hasher_tran = PoseidonTrait::new();    
    let tran_image_hash = hasher_tran.update(poseidon_hash_span(orig_image.data.span())).finalize();

    // -------------------------------------
    // compress pixel values
    // -------------------------------------
    let mut comp_orig: Array<felt252> = array![];
    let mut comp_tran: Array<felt252>  = array![];
    for i in 0..orig_image.height {
        for j in 0..orig_image.width {
            for k in 0..3 {
                comp_orig.append();
            };
        };
    };

    // ---------------------
    // assert transformation
    // ---------------------

    orig_image_hash + tran_image_hash
}
