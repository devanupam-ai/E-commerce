package com.ecommerce.controller;

import com.ecommerce.model.Address;
import com.ecommerce.model.User;
import com.ecommerce.repository.AddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/addresses") @RequiredArgsConstructor
public class AddressController {
    private final AddressRepository addressRepository;

    @GetMapping
    public ResponseEntity<List<Address>> getAddresses(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(addressRepository.findByUserId(user.getId()));
    }

    @PostMapping
    public ResponseEntity<Address> addAddress(@AuthenticationPrincipal User user,
                                              @RequestBody Address address) {
        address.setUser(user);
        return ResponseEntity.ok(addressRepository.save(address));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Address> updateAddress(@AuthenticationPrincipal User user,
                                                  @PathVariable Long id,
                                                  @RequestBody Address updated) {
        return addressRepository.findById(id).map(addr -> {
            if (!addr.getUser().getId().equals(user.getId()))
                return ResponseEntity.status(403).<Address>build();
            addr.setLabel(updated.getLabel());
            addr.setAddressLine1(updated.getAddressLine1());
            addr.setAddressLine2(updated.getAddressLine2());
            addr.setCity(updated.getCity());
            addr.setState(updated.getState());
            addr.setPincode(updated.getPincode());
            return ResponseEntity.ok(addressRepository.save(addr));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAddress(@AuthenticationPrincipal User user,
                                           @PathVariable Long id) {
        addressRepository.findById(id).ifPresent(addr -> {
            if (addr.getUser().getId().equals(user.getId()))
                addressRepository.deleteById(id);
        });
        return ResponseEntity.ok().build();
    }
}
